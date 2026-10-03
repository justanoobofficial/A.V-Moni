import { NextRequest, NextResponse } from "next/server";
import {
  generateRandomArbitrageOpportunity,
  generateRandomValueBetOpportunity,
  INITIAL_ARBITRAGE_OPPORTUNITIES,
  INITIAL_VALUE_BETS,
} from "@/lib/dummyEngine";
import { calculateArbitrageStakes, calculateValueBetMetrics } from "@/lib/math";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "snapshot";

  if (mode === "tick") {
    const newArb = generateRandomArbitrageOpportunity();
    const newValueBet = generateRandomValueBetOpportunity();
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      scannerStatus: "Scanning (1xBet, SportyBet, Bet9ja)",
      newArbitrage: newArb,
      newValueBet,
    });
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    scannerStatus: "Scanning (1xBet, SportyBet, Bet9ja)",
    arbitrageOpportunities: INITIAL_ARBITRAGE_OPPORTUNITIES,
    valueBets: INITIAL_VALUE_BETS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === "calculate_arb") {
      const { totalInvestment = 10000, oddsA = 2.1, oddsB = 2.05, roundStep = 0 } = body;
      const result = calculateArbitrageStakes(
        Number(totalInvestment),
        Number(oddsA),
        Number(oddsB),
        Number(roundStep)
      );
      return NextResponse.json({ ok: true, result });
    }

    if (type === "calculate_kelly") {
      const {
        localOdds = 2.15,
        sharpOdds = 1.96,
        bankroll = 100000,
        kellyMultiplier = 0.5,
      } = body;
      const result = calculateValueBetMetrics(
        Number(localOdds),
        Number(sharpOdds),
        Number(bankroll),
        Number(kellyMultiplier)
      );
      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported calculation type", retryable: false },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request payload", retryable: true },
      { status: 400 }
    );
  }
}
