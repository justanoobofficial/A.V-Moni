export type CurrencyCode = "NGN" | "USD" | "GBP";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  /** Conversion rate from base NGN (1 USD = 1600 NGN, 1 GBP = 2050 NGN) */
  rateFromNGN: number;
  defaultStake: number;
}

export type SportType = "Football" | "Tennis" | "Basketball";

export type BookmakerName =
  | "SportyBet"
  | "1xBet"
  | "Bet9ja"
  | "BetKing"
  | "Pinnacle"
  | "22Bet"
  | "Parimatch";

export interface ArbitrageOpportunity {
  id: string;
  match: string;
  league: string;
  sport: SportType;
  marketType: string;
  outcomeA: string;
  bookieA: BookmakerName;
  oddsA: number;
  outcomeB: string;
  bookieB: BookmakerName;
  oddsB: number;
  /** Raw sum of implied probabilities: (1/OddsA) + (1/OddsB) */
  arbRatio: number;
  /** Implied book percentage: arbRatio * 100 (e.g., 96.42%) */
  arbPercentage: number;
  /** Guaranteed profit margin %: ((1 / arbRatio) - 1) * 100 */
  profitMargin: number;
  timeFound: string;
  createdAt: number;
  isNew?: boolean;
  aiConfidence?: number;
  matchStatus?: "LIVE" | "TODAY" | "UPCOMING";
  kickoffLabel?: string;
  liveScore?: string;
}

export interface ArbitrageCalculationResult {
  totalInvestment: number;
  oddsA: number;
  oddsB: number;
  arbRatio: number;
  arbPercentage: number;
  isArbitrage: boolean;
  profitMargin: number;
  stakeA: number;
  stakeB: number;
  stakeAPercent: number;
  stakeBPercent: number;
  payoutA: number;
  payoutB: number;
  guaranteedPayout: number;
  guaranteedProfit: number;
  minProfit: number;
  maxProfit: number;
}

export interface ExecutedArbitrageBet {
  id: string;
  match: string;
  league: string;
  sport: SportType;
  marketType: string;
  bookieA: BookmakerName;
  outcomeA: string;
  oddsA: number;
  stakeA: number; // Stored in NGN base
  bookieB: BookmakerName;
  outcomeB: string;
  oddsB: number;
  stakeB: number; // Stored in NGN base
  totalStake: number; // Stored in NGN base
  guaranteedPayout: number; // Stored in NGN base
  netProfit: number; // Stored in NGN base
  profitMargin: number;
  executedAt: string;
  timestamp: number;
  status: "Settled" | "Active Lock";
}

export interface ValueBetOpportunity {
  id: string;
  match: string;
  league: string;
  sport: SportType;
  marketType: string;
  outcome: string;
  localBookie: BookmakerName;
  localOdds: number;
  sharpBookie: BookmakerName;
  sharpOdds: number;
  sharpImpliedProb: number;
  localImpliedProb: number;
  impliedEdgePercent: number;
  evPercent: number;
  kellyFractionFull: number;
  timeFound: string;
  createdAt: number;
  isNew?: boolean;
  matchStatus?: "LIVE" | "TODAY" | "UPCOMING";
  kickoffLabel?: string;
  liveScore?: string;
}

export type GeminiKeyStatus = "Active" | "Rate Limited" | "Quota Exhausted";

export interface GeminiApiKeyItem {
  id: string;
  alias: string;
  key: string;
  maskedKey: string;
  status: GeminiKeyStatus;
  priority: number;
  lastUsed: string;
  requestCount: number;
  errorCount: number;
  latencyMs: number;
}

export interface RotationLogEntry {
  id: string;
  timestamp: string;
  action: "ROTATE_429" | "ROTATE_403" | "SUCCESS" | "KEY_ADDED" | "HEALTH_CHECK" | "RESET";
  keyAlias: string;
  maskedKey: string;
  statusCode: number;
  detail: string;
}

export interface TelegramAlertConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  alertHighArbOnly: boolean;
  minArbThreshold: number;
  sendDailySummary: boolean;
  alertValueBets: boolean;
  minEvThreshold: number;
  notifyKeyFailover: boolean;
  includeDeepLinks: boolean;
  activeBookmakers: BookmakerName[];
  scanIntervalSec: number;
}

export interface TelegramDispatchLog {
  id: string;
  timestamp: string;
  type: "SUREBET_ALERT" | "VALUE_BET_ALERT" | "DAILY_SUMMARY" | "TEST_PING" | "KEY_ROTATION";
  recipientChatId: string;
  messagePreview: string;
  status: "Delivered" | "Simulated";
}

export interface BankrollHistoryPoint {
  date: string;
  label: string;
  balanceNGN: number;
  dailyProfitNGN: number;
  betsExecuted: number;
}
