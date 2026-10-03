# A.V Moni Terminal — Sports Betting Arbitrage & Value Betting (+EV) System

**A.V Moni Terminal** is an institutional-grade Sports Betting Arbitrage (Surebetting), Value Betting (+EV Kelly Criterion), and Bankroll Management System with a built-in Google Gemini API Key Pooling & Failover Rotation mechanism.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS (Dark/Light Terminal Aesthetic — Slate 950/900 background, Slate 900/800 cards, Emerald 500 profit accents, Blue 500 secondary highlights)
- **Icons:** `lucide-react`
- **State Management:** React Context API (`TerminalContext`) with automatic `localStorage` persistence
- **API Engine:** Next.js Route Handlers (`/api/scanner`, `/api/gemini/rotate`, `/api/telegram/alert`)

---

## 📐 Core Views & Routes

1. **Overview Dashboard (`/`)**
   - **Metric Cards:** Total Bankroll (with `₦ NGN`, `$ USD`, `£ GBP` currency switcher & inline bankroll editor), Daily / Weekly Net Profit, Active Arbitrage Opportunities Found, and ROI % & Win Rate %.
   - **Bankroll Growth Chart:** Interactive SVG area & line equity curve with 7D / 14D range switcher and hover telemetry.
   - **Recent Arbitrage Log Feed:** Displays the last 5 executed surebets and +EV positions.

2. **Live Arbitrage Feed (`/arbitrage`)**
   - Real-time surebet table with columns: `Match / Sport`, `Market Type`, `Bookie A (Odds)`, `Bookie B (Odds)`, `Arbitrage %`, `Guaranteed Profit`, `Time Found`, and `Action`.
   - Filter bar for Sport (`Football`, `Tennis`, `Basketball`), Min Profit % (`>1.5%`, `>2.5%`, `>3.5%`), Bookmakers (`SportyBet`, `1xBet`, `Bet9ja`, `BetKing`, `22Bet`, `Parimatch`), and Search.
   - **Interactive Stake & Arbitrage Calculator Modal:** Calculates split stakes ($\text{Stake}_A$, $\text{Stake}_B$), stealth rounding, guaranteed payout, and profit margin, and logs executed bets directly to the bankroll.

3. **Value Betting (+EV) Terminal (`/value-bets`)**
   - Compares soft local bookmaker odds against sharp `Pinnacle` lines.
   - Columns: `Match`, `Outcome`, `Local Bookie (Odds)`, `Sharp Bookie Odds`, `Implied Edge %`, `Expected Value (+EV)`, and `Recommended Stake (Kelly Criterion)`.
   - Includes an interactive Kelly Criterion Calculator sandbox and fractional Kelly multiplier (`0.25x`, `0.50x`, `1.00x`).

4. **Gemini API Key Rotator & Settings (`/settings/api-keys`)**
   - Dynamic key pool manager displaying Key Alias, Key Masked (`AIzaSy...X9`), Status (`Active`, `Rate Limited`, `Quota Exhausted`), Priority, and Last Used timestamp.
   - Backed by `getValidGeminiKey()` in `/lib/geminiRotator.ts` with one-click HTTP 429 (Rate Limit) and HTTP 403 (Quota Exhausted) failover simulation.

5. **Telegram & Scraper Alerts (`/settings/telegram`)**
   - Configure `Telegram Bot Token`, `Chat ID`, alert thresholds (e.g., `Arbitrage > 2.0%`), daily bankroll summaries, monitored bookmaker scrapers, and live webhook dispatch testing.
