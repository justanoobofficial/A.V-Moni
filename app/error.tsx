"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn("[A.V Moni Error Boundary Caught]:", error?.message);
  }, [error]);

  const handleHardReset = () => {
    try {
      localStorage.removeItem("av_moni_terminal_state_v4");
    } catch {
      // Ignore storage access errors
    }
    reset();
  };

  return (
    <div className="min-h-[65vh] w-full flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-xl border border-[#D4AF37] bg-[#141414] p-6 space-y-4 shadow-[0_0_30px_rgba(212,175,55,0.22)]">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 rotate-45 items-center justify-center border border-[#D4AF37] bg-[#0A0A0A] text-[#D4AF37]">
            <AlertTriangle className="h-5 w-5 -rotate-45" />
          </div>
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              FAILOVER TELEMETRY NOTICE
            </div>
            <h2 className="text-lg font-extrabold tracking-wider text-white mt-0.5">
              Gemini Rotator busy, Retrying node...
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              The active scraper or Gemini intelligence node encountered a
              transient interruption. Your bankroll ledger and active locks
              remain safely persisted.
            </p>
          </div>
        </div>

        {error?.message && (
          <div className="border border-slate-800 bg-[#0A0A0A] px-3.5 py-2 font-mono text-[11px] text-slate-400">
            Diagnostic: {error.message}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleHardReset}
            className="inline-flex items-center gap-1.5 border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Local State &amp; Recover</span>
          </button>

          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Node Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
