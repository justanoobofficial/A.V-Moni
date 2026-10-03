import {
  ArbitrageCalculationResult,
  CurrencyCode,
  CurrencyConfig,
} from "@/types";

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  NGN: {
    code: "NGN",
    symbol: "₦",
    name: "Nigerian Naira",
    rateFromNGN: 1,
    defaultStake: 50000,
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    rateFromNGN: 1 / 1600,
    defaultStake: 100,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    rateFromNGN: 1 / 2050,
    defaultStake: 100,
  },
};

/**
 * Formats a percentage value cleanly with a single '+' for positive numbers
 * and a single '-' for negative numbers (never '+-100.0%').
 */
export function formatSignedPercent(
  value: number,
  decimals: number = 1,
  includePlus: boolean = true
): string {
  if (!Number.isFinite(value) || Math.abs(value) < 1e-9) {
    return `0.${"0".repeat(decimals)}%`;
  }
  const absFormatted = Math.abs(value).toFixed(decimals);
  if (value < 0) {
    return `-${absFormatted}%`;
  }
  return `${includePlus ? "+" : ""}${absFormatted}%`;
}

/**
 * 1. Arbitrage Percentage Formula:
 * ArbRatio = (1 / OddsA) + (1 / OddsB)
 * If ArbRatio < 1.0, it is an arbitrage opportunity.
 * Profit Margin % = ((1 / ArbRatio) - 1) * 100
 */
export function calculateArbitrageMetrics(oddsA: number, oddsB: number): {
  arbRatio: number;
  arbPercentage: number;
  isArbitrage: boolean;
  profitMargin: number;
} {
  if (oddsA <= 1 || oddsB <= 1 || !Number.isFinite(oddsA) || !Number.isFinite(oddsB)) {
    return {
      arbRatio: 1,
      arbPercentage: 100,
      isArbitrage: false,
      profitMargin: 0,
    };
  }

  const invA = 1 / oddsA;
  const invB = 1 / oddsB;
  const arbRatio = invA + invB;
  const arbPercentage = arbRatio * 100;
  const isArbitrage = arbRatio < 1.0;
  const profitMargin = ((1 / arbRatio) - 1) * 100;

  return {
    arbRatio: Number(arbRatio.toFixed(6)),
    arbPercentage: Number(arbPercentage.toFixed(2)),
    isArbitrage,
    profitMargin: Number(profitMargin.toFixed(2)),
  };
}

/**
 * Calculates individual stakes for a two-way arbitrage opportunity:
 * StakeA = TotalInvestment * ((1/OddsA) / ((1/OddsA) + (1/OddsB)))
 * StakeB = TotalInvestment * ((1/OddsB) / ((1/OddsA) + (1/OddsB)))
 * Supports optional stealth rounding step (0 = exact math, 10, 50, 100)
 */
export function calculateArbitrageStakes(
  totalInvestment: number,
  oddsA: number,
  oddsB: number,
  roundStep: number = 0
): ArbitrageCalculationResult {
  const safeTotal = Math.max(0, Number.isFinite(totalInvestment) ? totalInvestment : 0);
  const { arbRatio, arbPercentage, isArbitrage, profitMargin } =
    calculateArbitrageMetrics(oddsA, oddsB);

  if (safeTotal <= 0 || oddsA <= 1 || oddsB <= 1) {
    return {
      totalInvestment: safeTotal,
      oddsA,
      oddsB,
      arbRatio,
      arbPercentage,
      isArbitrage,
      profitMargin,
      stakeA: 0,
      stakeB: 0,
      stakeAPercent: 50,
      stakeBPercent: 50,
      payoutA: 0,
      payoutB: 0,
      guaranteedPayout: 0,
      guaranteedProfit: 0,
      minProfit: 0,
      maxProfit: 0,
    };
  }

  const invA = 1 / oddsA;
  const invB = 1 / oddsB;
  const sumInv = invA + invB;

  const weightA = invA / sumInv;
  const weightB = invB / sumInv;

  let stakeA = safeTotal * weightA;
  let stakeB = safeTotal * weightB;

  if (roundStep > 0 && safeTotal >= roundStep * 4) {
    stakeA = Math.round(stakeA / roundStep) * roundStep;
    stakeB = Math.max(0, safeTotal - stakeA);
  } else {
    stakeA = Number(stakeA.toFixed(2));
    stakeB = Number(stakeB.toFixed(2));
  }

  const payoutA = Number((stakeA * oddsA).toFixed(2));
  const payoutB = Number((stakeB * oddsB).toFixed(2));
  const actualTotal = Number((stakeA + stakeB).toFixed(2));

  const profitA = Number((payoutA - actualTotal).toFixed(2));
  const profitB = Number((payoutB - actualTotal).toFixed(2));

  // Exact mathematical guaranteed payout & profit when unrounded, or worst-case when rounded
  const guaranteedPayout =
    roundStep === 0
      ? Number((safeTotal / sumInv).toFixed(2))
      : Math.min(payoutA, payoutB);

  const guaranteedProfit =
    roundStep === 0
      ? Number((guaranteedPayout - safeTotal).toFixed(2))
      : Math.min(profitA, profitB);

  return {
    totalInvestment: actualTotal,
    oddsA,
    oddsB,
    arbRatio,
    arbPercentage,
    isArbitrage,
    profitMargin,
    stakeA,
    stakeB,
    stakeAPercent: Number((weightA * 100).toFixed(1)),
    stakeBPercent: Number((weightB * 100).toFixed(1)),
    payoutA,
    payoutB,
    guaranteedPayout,
    guaranteedProfit,
    minProfit: Math.min(profitA, profitB),
    maxProfit: Math.max(profitA, profitB),
  };
}

/**
 * 2. Kelly Criterion Calculator for Value Bets (+EV):
 * f* = (p * b - (1 - p)) / b
 * Where p = sharp implied probability (1 / SharpOdds)
 * and b = (LocalOdds - 1)
 */
export function calculateValueBetMetrics(
  localOdds: number,
  sharpOdds: number,
  bankroll: number = 100000,
  kellyMultiplier: number = 0.5
): {
  sharpImpliedProb: number;
  localImpliedProb: number;
  impliedEdgePercent: number;
  evPercent: number;
  kellyFractionFull: number;
  recommendedFraction: number;
  recommendedStake: number;
} {
  if (localOdds <= 1 || sharpOdds <= 1) {
    return {
      sharpImpliedProb: 0,
      localImpliedProb: 0,
      impliedEdgePercent: 0,
      evPercent: 0,
      kellyFractionFull: 0,
      recommendedFraction: 0,
      recommendedStake: 0,
    };
  }

  const p = 1 / sharpOdds; // True/sharp implied probability
  const q = 1 - p;
  const b = localOdds - 1; // Net decimal odds offered by local bookmaker

  const localImpliedProb = 1 / localOdds;
  const impliedEdgePercent = (p - localImpliedProb) * 100;

  // Expected Value: EV = (p * LocalOdds) - 1
  const evPercent = (p * localOdds - 1) * 100;

  // Kelly formula: f* = (p * b - (1 - p)) / b
  const rawKelly = (p * b - q) / b;
  const kellyFractionFull = Math.max(0, rawKelly);
  const recommendedFraction = Math.min(0.25, kellyFractionFull * kellyMultiplier);
  const recommendedStake = Number((bankroll * recommendedFraction).toFixed(2));

  return {
    sharpImpliedProb: Number((p * 100).toFixed(2)),
    localImpliedProb: Number((localImpliedProb * 100).toFixed(2)),
    impliedEdgePercent: Number(impliedEdgePercent.toFixed(2)),
    evPercent: Number(evPercent.toFixed(2)),
    kellyFractionFull: Number((kellyFractionFull * 100).toFixed(2)),
    recommendedFraction: Number((recommendedFraction * 100).toFixed(2)),
    recommendedStake,
  };
}

/**
 * Currency conversion & formatting utilities
 */
export function convertFromNGN(amountNGN: number, currency: CurrencyCode): number {
  const rate = CURRENCIES[currency]?.rateFromNGN ?? 1;
  return amountNGN * rate;
}

export function convertToNGN(amountInCurrency: number, currency: CurrencyCode): number {
  const rate = CURRENCIES[currency]?.rateFromNGN ?? 1;
  return rate > 0 ? amountInCurrency / rate : amountInCurrency;
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "NGN",
  options?: { compact?: boolean; decimals?: number; showSign?: boolean }
): string {
  const config = CURRENCIES[currency] || CURRENCIES.NGN;
  const absVal = Math.abs(amount);
  const sign = amount < 0 ? "-" : options?.showSign && amount > 0 ? "+" : "";

  if (options?.compact && absVal >= 1_000_000) {
    return `${sign}${config.symbol}${(absVal / 1_000_000).toFixed(2)}M`;
  }

  const decimals =
    options?.decimals !== undefined
      ? options.decimals
      : currency === "NGN" && absVal >= 100
      ? 0
      : 2;

  const formatted = absVal.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${sign}${config.symbol}${formatted}`;
}

export function maskApiKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  if (trimmed.length <= 10) {
    return `${trimmed.slice(0, 4)}...${trimmed.slice(-2)}`;
  }
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}
