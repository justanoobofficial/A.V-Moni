"use client";

import React, { useMemo, useState } from "react";
import { TrendingUp, Calendar } from "lucide-react";
import { useTerminal } from "@/context/TerminalContext";
import { formatSignedPercent } from "@/lib/math";

export default function BankrollChart() {
  const { bankrollHistory, formatAmountFromNGN, convertNGNToCurrent, currency } =
    useTerminal();

  const [range, setRange] = useState<"7D" | "14D">("14D");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const visibleData = useMemo(() => {
    if (range === "7D") {
      return bankrollHistory.slice(-7);
    }
    return bankrollHistory;
  }, [bankrollHistory, range]);

  const chartGeometry = useMemo(() => {
    const width = 760;
    const height = 250;
    const padLeft = 18;
    const padRight = 18;
    const padTop = 24;
    const padBottom = 34;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    if (visibleData.length === 0) {
      return {
        width,
        height,
        points: [],
        linePath: "",
        areaPath: "",
        minVal: 0,
        maxVal: 100,
      };
    }

    const values = visibleData.map((d) => Math.max(0, d.balanceNGN));
    const minVal = Math.max(0, Math.min(...values) * 0.96);
    const maxVal = Math.max(100, Math.max(...values) * 1.02);
    const span = Math.max(1, maxVal - minVal);

    const points = visibleData.map((d, idx) => {
      const safeBal = Math.max(0, d.balanceNGN);
      const x =
        padLeft +
        (visibleData.length === 1
          ? plotW / 2
          : (idx / (visibleData.length - 1)) * plotW);
      const y = padTop + plotH - ((safeBal - minVal) / span) * plotH;
      return { x, y, data: { ...d, balanceNGN: safeBal }, idx };
    });

    const linePath = points
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");

    const firstX = points[0]?.x ?? padLeft;
    const lastX = points[points.length - 1]?.x ?? width - padRight;
    const baseLineY = padTop + plotH;

    const areaPath = `${linePath} L ${lastX.toFixed(1)} ${baseLineY} L ${firstX.toFixed(
      1
    )} ${baseLineY} Z`;

    return {
      width,
      height,
      points,
      linePath,
      areaPath,
      minVal,
      maxVal,
    };
  }, [visibleData]);

  const startBalance = Math.max(0, visibleData[0]?.balanceNGN ?? 420000);
  const endBalance = Math.max(
    0,
    visibleData[visibleData.length - 1]?.balanceNGN ?? 500000
  );
  const periodGainNGN = endBalance - startBalance;
  const periodGainPctNum =
    startBalance > 0 ? (periodGainNGN / startBalance) * 100 : 0;
  const formattedGainPct = formatSignedPercent(periodGainPctNum, 2);

  const activePoint =
    hoveredIndex !== null && chartGeometry.points[hoveredIndex]
      ? chartGeometry.points[hoveredIndex]
      : chartGeometry.points[chartGeometry.points.length - 1];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Bankroll Growth Curve ({currency})
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compounded surebet & Kelly +EV equity trajectory
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-400">
            <span>
              {formatAmountFromNGN(periodGainNGN, { showSign: true })} (
              {formattedGainPct})
            </span>
          </div>

          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs font-mono">
            {(["7D", "14D"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  range === r
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Point Telemetry Bar */}
      {activePoint && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/90 bg-slate-950/60 px-3.5 py-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
            <span>{activePoint.data.label}</span>
            <span className="text-slate-600">|</span>
            <span>
              Equity:{" "}
              <strong className="text-white">
                {formatAmountFromNGN(activePoint.data.balanceNGN)}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400">
              Day Net:{" "}
              <strong>
                {formatAmountFromNGN(activePoint.data.dailyProfitNGN, {
                  showSign: true,
                })}
              </strong>
            </span>
            <span className="text-blue-400">
              {activePoint.data.betsExecuted} Surebets Locked
            </span>
          </div>
        </div>
      )}

      {/* Interactive SVG Area Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
          className="w-full h-56 select-none overflow-visible"
          role="img"
          aria-label="Bankroll Growth SVG Chart"
        >
          <defs>
            <linearGradient id="bankrollAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
              <stop offset="65%" stopColor="#1E3D59" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="bankrollLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#B59024" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#F2E8C4" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {[0.2, 0.45, 0.7, 0.9].map((ratio, idx) => {
            const y = 24 + (chartGeometry.height - 58) * ratio;
            const valAtLine =
              chartGeometry.maxVal -
              (chartGeometry.maxVal - chartGeometry.minVal) * ratio;
            return (
              <g key={idx}>
                <line
                  x1={18}
                  y1={y}
                  x2={chartGeometry.width - 18}
                  y2={y}
                  stroke="rgba(212, 175, 55, 0.18)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={22}
                  y={y - 5}
                  fill="#888888"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {currency === "NGN"
                    ? valAtLine >= 1_000_000
                      ? `₦${(valAtLine / 1_000_000).toFixed(2)}M`
                      : valAtLine >= 1_000
                      ? `₦${(valAtLine / 1_000).toFixed(0)}k`
                      : `₦${valAtLine.toFixed(0)}`
                    : `${currency === "USD" ? "$" : "£"}${convertNGNToCurrent(
                        valAtLine
                      ).toFixed(0)}`}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {chartGeometry.areaPath && (
            <path d={chartGeometry.areaPath} fill="url(#bankrollAreaGrad)" />
          )}

          {/* Main Growth Curve Line */}
          {chartGeometry.linePath && (
            <path
              d={chartGeometry.linePath}
              fill="none"
              stroke="url(#bankrollLineGrad)"
              strokeWidth="2.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          )}

          {/* Data Nodes & X-Axis Labels */}
          {chartGeometry.points.map((pt, i) => {
            const isHovered =
              hoveredIndex === i ||
              (hoveredIndex === null && i === chartGeometry.points.length - 1);
            return (
              <g
                key={pt.data.date}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Invisible wider hit zone */}
                <rect
                  x={pt.x - 18}
                  y={10}
                  width={36}
                  height={chartGeometry.height - 20}
                  fill="transparent"
                />

                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={20}
                    x2={pt.x}
                    y2={chartGeometry.height - 34}
                    stroke="#D4AF37"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}

                <rect
                  x={pt.x - (isHovered ? 5 : 3.5)}
                  y={pt.y - (isHovered ? 5 : 3.5)}
                  width={isHovered ? 10 : 7}
                  height={isHovered ? 10 : 7}
                  transform={`rotate(45 ${pt.x} ${pt.y})`}
                  fill={isHovered ? "#D4AF37" : "#0A0A0A"}
                  stroke={isHovered ? "#F2E8C4" : "#D4AF37"}
                  strokeWidth={isHovered ? 2 : 1.5}
                />

                {/* Show X-axis label on every 2nd point or last point */}
                {(i % 2 === 0 || i === chartGeometry.points.length - 1) && (
                  <text
                    x={pt.x}
                    y={chartGeometry.height - 10}
                    textAnchor="middle"
                    fill={isHovered ? "#D4AF37" : "#888888"}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isHovered ? "bold" : "normal"}
                  >
                    {pt.data.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
