import React from "react";

export default function Loading() {
  return (
    <div className="min-h-[65vh] w-full flex flex-col items-center justify-center p-8 text-center">
      <div className="relative flex h-14 w-14 rotate-45 items-center justify-center border-2 border-[#D4AF37] bg-[#141414] shadow-[0_0_24px_rgba(212,175,55,0.35)] animate-pulse">
        <div className="h-6 w-6 border border-[#F2E8C4] bg-[#D4AF37]/20" />
      </div>
      <h2 className="mt-6 text-sm font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
        Synchronizing A.V Moni Syndicate Terminal
      </h2>
      <p className="mt-1.5 font-mono text-xs text-slate-400">
        Verifying Gemini Key Pool &amp; Live Bookmaker Liquidity Streams...
      </p>
    </div>
  );
}
