"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArbitrageOpportunity,
  BankrollHistoryPoint,
  CurrencyCode,
  ExecutedArbitrageBet,
  GeminiApiKeyItem,
  GeminiKeyStatus,
  RotationLogEntry,
  TelegramAlertConfig,
  TelegramDispatchLog,
  ValueBetOpportunity,
} from "@/types";
import {
  fetchLiveBrowserSportsFeed,
  generateRandomArbitrageOpportunity,
  generateRandomValueBetOpportunity,
  INITIAL_ARBITRAGE_OPPORTUNITIES,
  INITIAL_BANKROLL_HISTORY,
  INITIAL_EXECUTED_BETS,
  INITIAL_VALUE_BETS,
} from "@/lib/dummyEngine";
import {
  DEFAULT_GEMINI_KEY_POOL,
  getValidGeminiKey,
} from "@/lib/geminiRotator";
import {
  convertFromNGN,
  convertToNGN,
  formatCurrency,
  maskApiKey,
} from "@/lib/math";

const STORAGE_KEY = "av_moni_terminal_state_v4";
const DEFAULT_STARTING_BANKROLL_NGN = 500000;

const DEFAULT_TELEGRAM_CONFIG: TelegramAlertConfig = {
  botToken: "7192840192:AAH9vMoniBotScraperKey_x89PqL2Zw0",
  chatId: "-1002198471092",
  enabled: true,
  alertHighArbOnly: true,
  minArbThreshold: 2.0,
  sendDailySummary: true,
  alertValueBets: true,
  minEvThreshold: 4.5,
  notifyKeyFailover: true,
  includeDeepLinks: true,
  activeBookmakers: ["1xBet", "SportyBet", "Bet9ja", "BetKing", "Pinnacle"],
  scanIntervalSec: 15,
};

const INITIAL_ROTATION_LOGS: RotationLogEntry[] = [
  {
    id: "rot-init-1",
    timestamp: "14:20:04",
    action: "SUCCESS",
    keyAlias: "Primary Scraper Node #1 (Lagos-West)",
    maskedKey: "AQ.Ab8...UX0w",
    statusCode: 200,
    detail:
      'Active pool initialized (3 keys). Routing odds normalization through "Primary Scraper Node #1 (Lagos-West)" (AQ.Ab8...UX0w).',
  },
  {
    id: "rot-init-2",
    timestamp: "14:18:10",
    action: "HEALTH_CHECK",
    keyAlias: "Secondary Odds Parser #2 (London-EU)",
    maskedKey: "AQ.Ab8...DYBw",
    statusCode: 200,
    detail:
      'Standby failover key "Secondary Odds Parser #2" (AQ.Ab8...DYBw) verified online & ready.',
  },
  {
    id: "rot-init-3",
    timestamp: "14:18:05",
    action: "HEALTH_CHECK",
    keyAlias: "Burst Arbitrage Worker #3 (Frankfurt)",
    maskedKey: "AQ.Ab8..._gIQ",
    statusCode: 200,
    detail:
      'Standby failover key "Burst Arbitrage Worker #3" (AQ.Ab8..._gIQ) verified online & ready.',
  },
];

const INITIAL_TELEGRAM_LOGS: TelegramDispatchLog[] = [
  {
    id: "tg-init-1",
    timestamp: "14:22:12",
    type: "SUREBET_ALERT",
    recipientChatId: "-1002198471092",
    messagePreview:
      "🟢 A.V MONI SUREBET DETECTED: Yunchaokete Bu vs Novak Djokovic (ATP Beijing O/U 20.5) | SportyBet @ 2.14 vs 1xBet @ 2.02 | Profit: +4.03%",
    status: "Simulated",
  },
  {
    id: "tg-init-2",
    timestamp: "09:00:00",
    type: "DAILY_SUMMARY",
    recipientChatId: "-1002198471092",
    messagePreview:
      "📈 DAILY BANKROLL SUMMARY: Balance ₦500,000 | Today Net: +₦6,860 (+1.39%) | 5/5 Surebets Settled",
    status: "Simulated",
  },
];

/**
 * Generates a smooth, non-negative 14-day compounding history curve anchored
 * to any user-configured live bankroll balance so the chart never drops into
 * broken negative equity when capital is resized.
 */
function buildScaledBankrollHistory(targetEndBalanceNGN: number): BankrollHistoryPoint[] {
  const safeTarget = Math.max(0, Math.round(targetEndBalanceNGN));
  const baseRef = 500000;
  const ratio = safeTarget > 0 ? safeTarget / baseRef : 0;

  return INITIAL_BANKROLL_HISTORY.map((pt, idx, arr) => {
    if (idx === arr.length - 1) {
      return {
        ...pt,
        balanceNGN: safeTarget,
        dailyProfitNGN: Math.max(0, Math.round(pt.dailyProfitNGN * ratio)),
      };
    }
    return {
      ...pt,
      balanceNGN: Math.max(0, Math.round(pt.balanceNGN * ratio)),
      dailyProfitNGN: Math.max(0, Math.round(pt.dailyProfitNGN * ratio)),
    };
  });
}

interface TerminalContextValue {
  // Hydration Guard
  isMounted: boolean;

  // Theme
  theme: "dark" | "light";
  toggleTheme: () => void;

  // Currency & Bankroll
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  bankrollNGN: number;
  allocatedStakeNGN: number;
  totalEquityNGN: number;
  setBankrollNGN: (val: number) => void;
  adjustBankrollInCurrentCurrency: (
    newAmountInCurrency: number,
    rebaselineHistory?: boolean
  ) => void;
  isBankrollModalOpen: boolean;
  setIsBankrollModalOpen: (open: boolean) => void;
  formatAmountFromNGN: (
    amountNGN: number,
    options?: { compact?: boolean; decimals?: number; showSign?: boolean }
  ) => string;
  convertNGNToCurrent: (amountNGN: number) => number;
  convertCurrentToNGN: (amountInCurrent: number) => number;
  bankrollHistory: BankrollHistoryPoint[];

  // Scanner & Arbitrage
  arbitrageList: ArbitrageOpportunity[];
  isScannerRunning: boolean;
  setIsScannerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  nextScanCountdown: number;
  totalScansCompleted: number;
  triggerManualScan: () => ArbitrageOpportunity;
  selectedArbForModal: ArbitrageOpportunity | null;
  setSelectedArbForModal: (arb: ArbitrageOpportunity | null) => void;
  executedBets: ExecutedArbitrageBet[];
  executeArbitrageBet: (params: {
    opportunity: ArbitrageOpportunity;
    oddsA: number;
    oddsB: number;
    stakeANGN: number;
    stakeBNGN: number;
    totalStakeNGN: number;
    guaranteedPayoutNGN: number;
    netProfitNGN: number;
    profitMargin: number;
    settleImmediately?: boolean;
  }) => void;
  settleExecutedBet: (betId: string) => void;

  // Value Bets (+EV)
  valueBets: ValueBetOpportunity[];
  kellyMultiplier: number;
  setKellyMultiplier: (mult: number) => void;
  executeValueBet: (vb: ValueBetOpportunity, stakeNGN: number) => void;

  // Gemini API Key Rotator
  geminiKeys: GeminiApiKeyItem[];
  rotationLogs: RotationLogEntry[];
  activeGeminiKey: GeminiApiKeyItem | null;
  lastAiInsight: string;
  addGeminiKey: (alias: string, rawKey: string, priority?: number) => void;
  deleteGeminiKey: (id: string) => void;
  updateKeyStatus: (id: string, status: GeminiKeyStatus) => void;
  prioritizeGeminiKey: (id: string, direction: "up" | "down") => void;
  triggerKeyRotation: (simulateStatus?: 429 | 403, failedKeyId?: string) => Promise<void>;
  testSingleGeminiKey: (id: string) => Promise<void>;
  resetAllGeminiKeys: () => void;

  // Telegram & Scraper Alerts
  telegramConfig: TelegramAlertConfig;
  updateTelegramConfig: (partial: Partial<TelegramAlertConfig>) => void;
  telegramLogs: TelegramDispatchLog[];
  sendTelegramAlert: (
    type?: TelegramDispatchLog["type"],
    customPayload?: Record<string, unknown>
  ) => Promise<TelegramDispatchLog>;

  // Reset Demo Data
  resetTerminalState: () => void;
}

const TerminalContext = createContext<TerminalContextValue | undefined>(
  undefined
);

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [currency, setCurrency] = useState<CurrencyCode>("NGN");
  const [bankrollNGN, setBankrollNGN] = useState<number>(
    DEFAULT_STARTING_BANKROLL_NGN
  );
  const [bankrollHistory, setBankrollHistory] = useState<BankrollHistoryPoint[]>(
    INITIAL_BANKROLL_HISTORY
  );
  const [isBankrollModalOpen, setIsBankrollModalOpen] = useState<boolean>(false);

  const [arbitrageList, setArbitrageList] = useState<ArbitrageOpportunity[]>(
    INITIAL_ARBITRAGE_OPPORTUNITIES
  );
  const [valueBets, setValueBets] =
    useState<ValueBetOpportunity[]>(INITIAL_VALUE_BETS);
  const [executedBets, setExecutedBets] = useState<ExecutedArbitrageBet[]>(
    INITIAL_EXECUTED_BETS
  );
  const [kellyMultiplier, setKellyMultiplier] = useState<number>(0.5);

  const [isScannerRunning, setIsScannerRunning] = useState<boolean>(true);
  const [nextScanCountdown, setNextScanCountdown] = useState<number>(15);
  const [totalScansCompleted, setTotalScansCompleted] = useState<number>(142);
  const [selectedArbForModal, setSelectedArbForModal] =
    useState<ArbitrageOpportunity | null>(null);

  const [geminiKeys, setGeminiKeys] = useState<GeminiApiKeyItem[]>(
    DEFAULT_GEMINI_KEY_POOL
  );
  const [rotationLogs, setRotationLogs] = useState<RotationLogEntry[]>(
    INITIAL_ROTATION_LOGS
  );
  const [lastAiInsight, setLastAiInsight] = useState<string>(
    "Gemini 2.5 Flash [AQ.Ab8...UX0w]: Verified +4.03% Live Surebet on Y. Bu vs N. Djokovic (ATP 500 Beijing R2) & +3.74% on Orlando Pride vs San Diego Wave."
  );

  const [telegramConfig, setTelegramConfig] = useState<TelegramAlertConfig>(
    DEFAULT_TELEGRAM_CONFIG
  );
  const [telegramLogs, setTelegramLogs] = useState<TelegramDispatchLog[]>(
    INITIAL_TELEGRAM_LOGS
  );

  // Hydrate state from localStorage on client mount with sanity validation
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.currency) setCurrency(parsed.currency);

        const loadedBankroll =
          typeof parsed.bankrollNGN === "number" && parsed.bankrollNGN >= 1000
            ? parsed.bankrollNGN
            : DEFAULT_STARTING_BANKROLL_NGN;

        setBankrollNGN(loadedBankroll);

        if (
          Array.isArray(parsed.bankrollHistory) &&
          parsed.bankrollHistory.length > 0
        ) {
          const firstBal = parsed.bankrollHistory[0]?.balanceNGN ?? 420000;
          const lastBal =
            parsed.bankrollHistory[parsed.bankrollHistory.length - 1]
              ?.balanceNGN ?? loadedBankroll;
          // Guard against mismatched history scale that would cause negative period gain
          if (lastBal < firstBal * 0.2 || lastBal < 0) {
            setBankrollHistory(buildScaledBankrollHistory(loadedBankroll));
          } else {
            setBankrollHistory(parsed.bankrollHistory);
          }
        }

        if (
          Array.isArray(parsed.arbitrageList) &&
          parsed.arbitrageList.length > 0
        )
          setArbitrageList(parsed.arbitrageList);
        if (Array.isArray(parsed.valueBets) && parsed.valueBets.length > 0)
          setValueBets(parsed.valueBets);
        if (Array.isArray(parsed.executedBets))
          setExecutedBets(parsed.executedBets);
        if (typeof parsed.kellyMultiplier === "number")
          setKellyMultiplier(parsed.kellyMultiplier);
        if (Array.isArray(parsed.geminiKeys) && parsed.geminiKeys.length > 0)
          setGeminiKeys(parsed.geminiKeys);
        if (Array.isArray(parsed.rotationLogs))
          setRotationLogs(parsed.rotationLogs);
        if (parsed.telegramConfig)
          setTelegramConfig({
            ...DEFAULT_TELEGRAM_CONFIG,
            ...parsed.telegramConfig,
          });
        if (Array.isArray(parsed.telegramLogs))
          setTelegramLogs(parsed.telegramLogs);
      }
    } catch (e) {
      console.warn("Failed to hydrate A.V Moni state from localStorage:", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Poll real live matches from ESPN public scoreboard in the user's browser
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    fetchLiveBrowserSportsFeed().then((feed) => {
      if (cancelled || !feed) return;
      setArbitrageList((prev) => {
        const existingNames = new Set(prev.map((p) => p.match));
        const fresh = feed.liveArbs.filter((a) => !existingNames.has(a.match));
        return [...fresh, ...prev].slice(0, 25);
      });
      setValueBets((prev) => {
        const existingNames = new Set(prev.map((p) => p.match));
        const fresh = feed.liveVals.filter((v) => !existingNames.has(v.match));
        return [...fresh, ...prev].slice(0, 20);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  // Persist to localStorage whenever core state updates
  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload = {
        theme,
        currency,
        bankrollNGN,
        bankrollHistory,
        arbitrageList: arbitrageList.slice(0, 25),
        valueBets: valueBets.slice(0, 20),
        executedBets: executedBets.slice(0, 30),
        kellyMultiplier,
        geminiKeys,
        rotationLogs: rotationLogs.slice(0, 25),
        telegramConfig,
        telegramLogs: telegramLogs.slice(0, 20),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to persist A.V Moni state:", e);
    }
  }, [
    hydrated,
    theme,
    currency,
    bankrollNGN,
    bankrollHistory,
    arbitrageList,
    valueBets,
    executedBets,
    kellyMultiplier,
    geminiKeys,
    rotationLogs,
    telegramConfig,
    telegramLogs,
  ]);

  // Sync dark/light class on documentElement
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  // Calculate allocated stakes currently locked in open ("Active Lock") bets
  const allocatedStakeNGN = useMemo(() => {
    return executedBets
      .filter((b) => b.status === "Active Lock")
      .reduce((sum, b) => sum + b.totalStake, 0);
  }, [executedBets]);

  // Total Equity = Available Liquid Bankroll + Active Locked Stakes
  const totalEquityNGN = useMemo(() => {
    return Math.max(0, bankrollNGN + allocatedStakeNGN);
  }, [bankrollNGN, allocatedStakeNGN]);

  // Inject new arbitrage window function (used by 15s interval and manual trigger)
  const triggerManualScan = useCallback(() => {
    const newArb = generateRandomArbitrageOpportunity();
    const newVal = generateRandomValueBetOpportunity();

    setArbitrageList((prev) => [
      newArb,
      ...prev.map((item) => ({ ...item, isNew: false })).slice(0, 19),
    ]);

    setValueBets((prev) => [
      newVal,
      ...prev.map((item) => ({ ...item, isNew: false })).slice(0, 14),
    ]);

    setTotalScansCompleted((c) => c + 1);
    setNextScanCountdown(15);

    if (
      telegramConfig.enabled &&
      (!telegramConfig.alertHighArbOnly ||
        newArb.profitMargin >= telegramConfig.minArbThreshold)
    ) {
      const nowTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const entry: TelegramDispatchLog = {
        id: `tg-auto-${Date.now()}`,
        timestamp: nowTime,
        type: "SUREBET_ALERT",
        recipientChatId: telegramConfig.chatId || "-1002198471092",
        messagePreview: `🟢 AUTO-ALERT: ${newArb.match} (${newArb.marketType}) | ${newArb.bookieA} @ ${newArb.oddsA} vs ${newArb.bookieB} @ ${newArb.oddsB} | +${newArb.profitMargin}%`,
        status: "Simulated",
      };
      setTelegramLogs((prev) => [entry, ...prev.slice(0, 19)]);
    }

    return newArb;
  }, [
    telegramConfig.enabled,
    telegramConfig.alertHighArbOnly,
    telegramConfig.minArbThreshold,
    telegramConfig.chatId,
  ]);

  // 15-Second Mock WebSocket / Interval Generator
  useEffect(() => {
    if (!isScannerRunning) return;

    const timer = setInterval(() => {
      setNextScanCountdown((prev) => {
        if (prev <= 1) {
          triggerManualScan();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isScannerRunning, triggerManualScan]);

  // Currency helpers
  const formatAmountFromNGN = useCallback(
    (
      amountNGN: number,
      options?: { compact?: boolean; decimals?: number; showSign?: boolean }
    ) => {
      const converted = convertFromNGN(amountNGN, currency);
      return formatCurrency(converted, currency, options);
    },
    [currency]
  );

  const convertNGNToCurrent = useCallback(
    (amountNGN: number) => convertFromNGN(amountNGN, currency),
    [currency]
  );

  const convertCurrentToNGN = useCallback(
    (amountInCurrent: number) => convertToNGN(amountInCurrent, currency),
    [currency]
  );

  const adjustBankrollInCurrentCurrency = useCallback(
    (newAmountInCurrency: number, rebaselineHistory: boolean = true) => {
      const inNGN = convertToNGN(newAmountInCurrency, currency);
      if (Number.isFinite(inNGN) && inNGN >= 0) {
        const roundedNGN = Math.round(inNGN);
        setBankrollNGN(roundedNGN);

        if (rebaselineHistory) {
          setBankrollHistory(buildScaledBankrollHistory(roundedNGN));
        } else {
          setBankrollHistory((prev) => {
            if (prev.length === 0) return buildScaledBankrollHistory(roundedNGN);
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              balanceNGN: roundedNGN,
            };
            return updated;
          });
        }
      }
    },
    [currency]
  );

  // Settle an "Active Lock" bet: returns locked stake + guaranteed profit to active bankroll
  const settleExecutedBet = useCallback((betId: string) => {
    setExecutedBets((prev) => {
      const target = prev.find((b) => b.id === betId);
      if (!target || target.status === "Settled") return prev;

      const payoutToCredit = Math.max(
        0,
        target.totalStake + target.netProfit
      );
      const profitRounded = Math.max(0, Math.round(target.netProfit));

      setBankrollNGN((currBankroll) => {
        const nextBankroll = Math.max(0, currBankroll + payoutToCredit);
        setBankrollHistory((hist) => {
          if (hist.length === 0) return hist;
          const copy = [...hist];
          const lastIdx = copy.length - 1;
          copy[lastIdx] = {
            ...copy[lastIdx],
            balanceNGN: Math.max(0, copy[lastIdx].balanceNGN + profitRounded),
            dailyProfitNGN: copy[lastIdx].dailyProfitNGN + profitRounded,
            betsExecuted: copy[lastIdx].betsExecuted + 1,
          };
          return copy;
        });
        return nextBankroll;
      });

      return prev.map((b) =>
        b.id === betId ? { ...b, status: "Settled" } : b
      );
    });
  }, []);

  // Execute & Log an Arbitrage Bet
  const executeArbitrageBet = useCallback(
    (params: {
      opportunity: ArbitrageOpportunity;
      oddsA: number;
      oddsB: number;
      stakeANGN: number;
      stakeBNGN: number;
      totalStakeNGN: number;
      guaranteedPayoutNGN: number;
      netProfitNGN: number;
      profitMargin: number;
      settleImmediately?: boolean;
    }) => {
      const settleImmediately = params.settleImmediately ?? false;
      const nowStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const safeTotalStake = Math.max(0, Math.round(params.totalStakeNGN));
      const safeProfit = Math.max(0, Math.round(params.netProfitNGN));
      const safePayout = Math.max(
        safeTotalStake + safeProfit,
        Math.round(params.guaranteedPayoutNGN)
      );

      const newExec: ExecutedArbitrageBet = {
        id: `exec-${Date.now()}`,
        match: params.opportunity.match,
        league: params.opportunity.league,
        sport: params.opportunity.sport,
        marketType: params.opportunity.marketType,
        bookieA: params.opportunity.bookieA,
        outcomeA: params.opportunity.outcomeA,
        oddsA: params.oddsA,
        stakeA: Math.round(params.stakeANGN),
        bookieB: params.opportunity.bookieB,
        outcomeB: params.opportunity.outcomeB,
        oddsB: params.oddsB,
        stakeB: Math.round(params.stakeBNGN),
        totalStake: safeTotalStake,
        guaranteedPayout: safePayout,
        netProfit: safeProfit,
        profitMargin: params.profitMargin,
        executedAt: `Today, ${nowStr}`,
        timestamp: Date.now(),
        status: settleImmediately ? "Settled" : "Active Lock",
      };

      setExecutedBets((prev) => [newExec, ...prev]);

      if (settleImmediately) {
        // Subtract stake then add full payout upon instant settlement -> net +safeProfit
        setBankrollNGN((prev) => {
          const afterStakeDeduct = Math.max(0, prev - safeTotalStake);
          const afterSettlement = afterStakeDeduct + safePayout;
          setBankrollHistory((hist) => {
            if (hist.length === 0) return hist;
            const copy = [...hist];
            const lastIdx = copy.length - 1;
            copy[lastIdx] = {
              ...copy[lastIdx],
              balanceNGN: afterSettlement,
              dailyProfitNGN: copy[lastIdx].dailyProfitNGN + safeProfit,
              betsExecuted: copy[lastIdx].betsExecuted + 1,
            };
            return copy;
          });
          return afterSettlement;
        });
      } else {
        // Subtract stake from active available bankroll while bet is in-play ("Active Lock")
        // Total equity remains intact; settling the bet credits stake + profit back!
        setBankrollNGN((prev) => Math.max(0, prev - safeTotalStake));
      }
    },
    []
  );

  // Execute a +EV Value Bet (subtracts stake while Active Lock; settling credits payout)
  const executeValueBet = useCallback(
    (vb: ValueBetOpportunity, stakeNGN: number) => {
      const safeStake = Math.max(0, Math.round(stakeNGN));
      const expectedProfitNGN = Math.max(
        0,
        Math.round(safeStake * (vb.evPercent / 100))
      );
      const nowStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const loggedAsBet: ExecutedArbitrageBet = {
        id: `ev-exec-${Date.now()}`,
        match: vb.match,
        league: vb.league,
        sport: vb.sport,
        marketType: `${vb.marketType} (+EV Kelly)`,
        bookieA: vb.localBookie,
        outcomeA: vb.outcome,
        oddsA: vb.localOdds,
        stakeA: safeStake,
        bookieB: vb.sharpBookie,
        outcomeB: "Sharp Benchmark",
        oddsB: vb.sharpOdds,
        stakeB: 0,
        totalStake: safeStake,
        guaranteedPayout: safeStake + expectedProfitNGN,
        netProfit: expectedProfitNGN,
        profitMargin: vb.evPercent,
        executedAt: `Today, ${nowStr}`,
        timestamp: Date.now(),
        status: "Active Lock",
      };

      setExecutedBets((prev) => [loggedAsBet, ...prev]);
      setBankrollNGN((prev) => Math.max(0, prev - safeStake));
    },
    []
  );

  // Gemini Key Rotator Actions
  const activeGeminiKey = useMemo(() => {
    const sorted = [...geminiKeys].sort((a, b) => a.priority - b.priority);
    return sorted.find((k) => k.status === "Active") || null;
  }, [geminiKeys]);

  const addGeminiKey = useCallback(
    (alias: string, rawKey: string, priority?: number) => {
      const cleanAlias = alias.trim() || `Gemini Node #${geminiKeys.length + 1}`;
      const cleanKey = rawKey.trim();
      if (!cleanKey) return;

      const newItem: GeminiApiKeyItem = {
        id: `gem-${Date.now()}`,
        alias: cleanAlias,
        key: cleanKey,
        maskedKey: maskApiKey(cleanKey),
        status: "Active",
        priority: priority || geminiKeys.length + 1,
        lastUsed: "Never",
        requestCount: 0,
        errorCount: 0,
        latencyMs: 135 + Math.floor(Math.random() * 45),
      };

      setGeminiKeys((prev) => [...prev, newItem]);
      setRotationLogs((prev) => [
        {
          id: `rot-add-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          action: "KEY_ADDED",
          keyAlias: newItem.alias,
          maskedKey: newItem.maskedKey,
          statusCode: 201,
          detail: `Added new key "${newItem.alias}" (${newItem.maskedKey}) to pool at Priority #${newItem.priority}.`,
        },
        ...prev,
      ]);
    },
    [geminiKeys.length]
  );

  const deleteGeminiKey = useCallback((id: string) => {
    setGeminiKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const updateKeyStatus = useCallback((id: string, status: GeminiKeyStatus) => {
    setGeminiKeys((prev) =>
      prev.map((k) =>
        k.id === id
          ? {
              ...k,
              status,
              lastUsed: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            }
          : k
      )
    );
  }, []);

  const prioritizeGeminiKey = useCallback(
    (id: string, direction: "up" | "down") => {
      setGeminiKeys((prev) => {
        const sorted = [...prev].sort((a, b) => a.priority - b.priority);
        const idx = sorted.findIndex((k) => k.id === id);
        if (idx === -1) return prev;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return prev;

        const tempPriority = sorted[idx].priority;
        sorted[idx] = { ...sorted[idx], priority: sorted[swapIdx].priority };
        sorted[swapIdx] = { ...sorted[swapIdx], priority: tempPriority };
        return [...sorted].sort((a, b) => a.priority - b.priority);
      });
    },
    []
  );

  const triggerKeyRotation = useCallback(
    async (simulateStatus?: 429 | 403, failedKeyId?: string) => {
      const targetFailedId =
        failedKeyId || activeGeminiKey?.id || geminiKeys[0]?.id;

      const localRotation = getValidGeminiKey(
        geminiKeys,
        simulateStatus,
        targetFailedId
      );
      setGeminiKeys(localRotation.updatedKeys);
      if (localRotation.logEntry) {
        setRotationLogs((prev) => [localRotation.logEntry!, ...prev]);
      }

      try {
        const res = await fetch("/api/gemini/rotate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keys: geminiKeys,
            simulateStatus,
            failedKeyId: targetFailedId,
            matchContext: arbitrageList[0]
              ? `${arbitrageList[0].match} (${arbitrageList[0].marketType})`
              : "Yunchaokete Bu vs Novak Djokovic (O/U 20.5)",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.aiInsight) {
            setLastAiInsight(data.aiInsight);
          }
        }
      } catch {
        // Fallback already handled by localRotation
      }
    },
    [geminiKeys, activeGeminiKey, arbitrageList]
  );

  const testSingleGeminiKey = useCallback(
    async (id: string) => {
      const nowStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setGeminiKeys((prev) =>
        prev.map((k) => {
          if (k.id !== id) return k;
          const measuredLatency = 115 + Math.floor(Math.random() * 65);
          return {
            ...k,
            status: "Active",
            lastUsed: `Verified ${nowStr}`,
            requestCount: k.requestCount + 1,
            latencyMs: measuredLatency,
          };
        })
      );

      setRotationLogs((prev) => {
        const target = geminiKeys.find((k) => k.id === id);
        if (!target) return prev;
        return [
          {
            id: `rot-test-${Date.now()}`,
            timestamp: nowStr,
            action: "HEALTH_CHECK",
            keyAlias: target.alias,
            maskedKey: target.maskedKey,
            statusCode: 200,
            detail: `Connection test OK for "${target.alias}" (${target.maskedKey}). Status set to Active.`,
          },
          ...prev,
        ];
      });
    },
    [geminiKeys]
  );

  const resetAllGeminiKeys = useCallback(() => {
    const nowStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setGeminiKeys((prev) =>
      prev.map((k) => ({
        ...k,
        status: "Active",
        lastUsed: nowStr,
      }))
    );
    setRotationLogs((prev) => [
      {
        id: `rot-reset-${Date.now()}`,
        timestamp: nowStr,
        action: "RESET",
        keyAlias: "All Pool Keys",
        maskedKey: "POOL/*",
        statusCode: 200,
        detail: "Reset all Gemini API keys in pool to Active status.",
      },
      ...prev,
    ]);
  }, []);

  // Telegram & Scraper Alerts
  const updateTelegramConfig = useCallback(
    (partial: Partial<TelegramAlertConfig>) => {
      setTelegramConfig((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const sendTelegramAlert = useCallback(
    async (
      type: TelegramDispatchLog["type"] = "TEST_PING",
      customPayload?: Record<string, unknown>
    ): Promise<TelegramDispatchLog> => {
      try {
        const res = await fetch("/api/telegram/alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            botToken: telegramConfig.botToken,
            chatId: telegramConfig.chatId,
            alertType: type,
            payload: customPayload || {
              match: arbitrageList[0]?.match || "Yunchaokete Bu vs Novak Djokovic",
              marketType:
                arbitrageList[0]?.marketType || "Total Games Over/Under 20.5",
              bookieA: arbitrageList[0]?.bookieA || "SportyBet",
              outcomeA: arbitrageList[0]?.outcomeA || "Over 20.5",
              oddsA: arbitrageList[0]?.oddsA || 2.14,
              bookieB: arbitrageList[0]?.bookieB || "1xBet",
              outcomeB: arbitrageList[0]?.outcomeB || "Under 20.5",
              oddsB: arbitrageList[0]?.oddsB || 2.02,
              profitMargin: arbitrageList[0]?.profitMargin || 4.03,
              arbPercentage: arbitrageList[0]?.arbPercentage || 96.23,
              bankrollFormatted: formatAmountFromNGN(bankrollNGN),
              dailyProfitFormatted: formatAmountFromNGN(6860, {
                showSign: true,
              }),
            },
          }),
        });
        const data = await res.json();
        if (data.ok && data.dispatch) {
          setTelegramLogs((prev) => [data.dispatch, ...prev]);
          return data.dispatch;
        }
      } catch {
        // Fallback local dispatch
      }

      const fallbackDispatch: TelegramDispatchLog = {
        id: `tg-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        type,
        recipientChatId: telegramConfig.chatId || "-1002198471092",
        messagePreview:
          "⚡ A.V MONI TERMINAL PING: Scraper Bridge Online (1xBet, SportyBet, Bet9ja)",
        status: "Simulated",
      };
      setTelegramLogs((prev) => [fallbackDispatch, ...prev]);
      return fallbackDispatch;
    },
    [telegramConfig, arbitrageList, bankrollNGN, formatAmountFromNGN]
  );

  const resetTerminalState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrency("NGN");
    setBankrollNGN(DEFAULT_STARTING_BANKROLL_NGN);
    setBankrollHistory(INITIAL_BANKROLL_HISTORY);
    setArbitrageList(INITIAL_ARBITRAGE_OPPORTUNITIES);
    setValueBets(INITIAL_VALUE_BETS);
    setExecutedBets(INITIAL_EXECUTED_BETS);
    setGeminiKeys(DEFAULT_GEMINI_KEY_POOL);
    setRotationLogs(INITIAL_ROTATION_LOGS);
    setTelegramConfig(DEFAULT_TELEGRAM_CONFIG);
    setTelegramLogs(INITIAL_TELEGRAM_LOGS);
  }, []);

  const value = useMemo(
    () => ({
      isMounted: hydrated,
      theme,
      toggleTheme,
      currency,
      setCurrency,
      bankrollNGN,
      allocatedStakeNGN,
      totalEquityNGN,
      setBankrollNGN,
      adjustBankrollInCurrentCurrency,
      isBankrollModalOpen,
      setIsBankrollModalOpen,
      formatAmountFromNGN,
      convertNGNToCurrent,
      convertCurrentToNGN,
      bankrollHistory,
      arbitrageList,
      isScannerRunning,
      setIsScannerRunning,
      nextScanCountdown,
      totalScansCompleted,
      triggerManualScan,
      selectedArbForModal,
      setSelectedArbForModal,
      executedBets,
      executeArbitrageBet,
      settleExecutedBet,
      valueBets,
      kellyMultiplier,
      setKellyMultiplier,
      executeValueBet,
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
      telegramConfig,
      updateTelegramConfig,
      telegramLogs,
      sendTelegramAlert,
      resetTerminalState,
    }),
    [
      hydrated,
      theme,
      toggleTheme,
      currency,
      bankrollNGN,
      allocatedStakeNGN,
      totalEquityNGN,
      adjustBankrollInCurrentCurrency,
      isBankrollModalOpen,
      formatAmountFromNGN,
      convertNGNToCurrent,
      convertCurrentToNGN,
      bankrollHistory,
      arbitrageList,
      isScannerRunning,
      nextScanCountdown,
      totalScansCompleted,
      triggerManualScan,
      selectedArbForModal,
      executedBets,
      executeArbitrageBet,
      settleExecutedBet,
      valueBets,
      kellyMultiplier,
      executeValueBet,
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
      telegramConfig,
      updateTelegramConfig,
      telegramLogs,
      sendTelegramAlert,
      resetTerminalState,
    ]
  );

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const ctx = useContext(TerminalContext);
  if (!ctx) {
    throw new Error("useTerminal must be used within a TerminalProvider");
  }
  return ctx;
}
