/**
 * forecast.ts — Pure demand forecasting math module
 *
 * Zero Prisma imports. All functions are pure TypeScript operating on plain data.
 * analytics.ts maps Prisma types to EventRecord before calling these functions.
 *
 * Tiered model progression:
 *   none         — 0 same-day-of-week logs: no prediction possible
 *   wma          — 1–7 same-day logs: Weighted Moving Average (same-weekday, last 3)
 *   holt-winters — 8+ same-day logs: Holt-Winters triple exponential smoothing (s=7)
 *
 * Event multipliers are looked up and applied in analytics.ts after base forecast.
 * Event-day logs are EXCLUDED from training data (see isEventDay) to prevent
 * holiday-spike contamination from drifting the baseline forecast upward.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ForecastTier = "none" | "wma" | "holt-winters";

/** Lean event record — no Prisma dependency. Map from Prisma at call site. */
export interface EventRecord {
  date:           Date;
  multiplier:     number;
  recipeId:       string | null;
  repeatAnnually: boolean;
  createdAt:      Date;
  name:           string;
}

export interface HWResult {
  forecast:  number;
  /** actual − fitted for each step after warm-up (steps 8..n). Used for MAD/bias. */
  residuals: number[];
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export const round1dp = (n: number): number => Math.round(n * 10) / 10;

export function selectTier(sameDayCount: number): ForecastTier {
  if (sameDayCount === 0) return "none";
  if (sameDayCount <= 7) return "wma";
  return "holt-winters";
}

// ─── Event helpers ────────────────────────────────────────────────────────────

/**
 * Returns true if the given event matches the target date and recipe scope.
 * - One-time events: exact UTC date match (both stored as UTC midnight @db.Date)
 * - repeatAnnually: month + day-of-month match, any year
 * - Scope: event applies to this recipeId specifically, OR to all products (recipeId null)
 */
function matchesEvent(event: EventRecord, targetDate: Date, recipeId: string): boolean {
  const scope = event.recipeId === null || event.recipeId === recipeId;
  if (!scope) return false;

  if (event.repeatAnnually) {
    return (
      event.date.getUTCMonth() === targetDate.getUTCMonth() &&
      event.date.getUTCDate()  === targetDate.getUTCDate()
    );
  }
  // One-time: compare UTC timestamps (both are midnight UTC from @db.Date)
  return event.date.getTime() === targetDate.getTime();
}

/**
 * Returns true if this date is covered by any event for the given recipe.
 * Used to exclude event-day logs from baseline training (prevents model drift).
 */
export function isEventDay(date: Date, events: EventRecord[], recipeId: string): boolean {
  return events.some((e) => matchesEvent(e, date, recipeId));
}

/**
 * Returns the single winning EventRecord for a target date + recipe, or null.
 *
 * Tiebreaker chain (most specific wins):
 *   1. Product-specific event (recipeId set) beats all-products (recipeId null)
 *   2. Within same specificity: highest multiplier
 *   3. Tie: most recently created
 */
export function findActiveEvent(
  events: EventRecord[],
  targetDate: Date,
  recipeId: string
): EventRecord | null {
  const matching = events.filter((e) => matchesEvent(e, targetDate, recipeId));
  if (matching.length === 0) return null;

  return matching.sort((a, b) => {
    // Product-specific before all-products
    const aSpecific = a.recipeId !== null ? 1 : 0;
    const bSpecific = b.recipeId !== null ? 1 : 0;
    if (bSpecific !== aSpecific) return bSpecific - aSpecific;
    // Higher multiplier first
    if (b.multiplier !== a.multiplier) return b.multiplier - a.multiplier;
    // Newest first
    return b.createdAt.getTime() - a.createdAt.getTime();
  })[0];
}

// ─── Tier 1: Weighted Moving Average ─────────────────────────────────────────

/**
 * Weighted Moving Average on same-day-of-week series.
 *
 * @param series  Clean qtySold values, oldest-first, event days excluded
 * @param weights Recency weights, most-recent first. Default [0.5, 0.3, 0.2].
 *                Automatically normalized so fewer points work correctly.
 *
 * With 3 points: weights = [0.5, 0.3, 0.2] (most recent → oldest)
 * With 2 points: sliced to [0.5, 0.3], normalized to [0.625, 0.375]
 * With 1 point:  sliced to [0.5], normalized to [1.0]
 */
export function wma(series: number[], weights = [0.5, 0.3, 0.2]): number {
  const pts = series.slice(-3);                     // last 3 observations
  const w   = weights.slice(0, pts.length);         // trim to available count
  const sum = w.reduce((a, b) => a + b, 0);
  const wn  = w.map((x) => x / sum);               // normalize to sum=1
  // pts is oldest-to-newest; wn[0] is weight for most-recent (reversed)
  return [...pts].reverse().reduce((acc, v, i) => acc + v * wn[i], 0);
}

// ─── Tier 2: Holt-Winters Triple Exponential Smoothing ───────────────────────

/**
 * Multiplicative Holt-Winters with weekly seasonality (s=7).
 *
 * Operates on the FULL daily time series for a product (not just same-weekday).
 * Gaps (days with no log) are skipped naturally — the loop only iterates
 * over actual observed data points, keeping L and T state between gaps.
 *
 * Parameters (conservative defaults for stable bakery demand):
 *   α = 0.3  — level smoothing (higher = more reactive to recent data)
 *   β = 0.1  — trend smoothing (low because bakery demand trends slowly)
 *   γ = 0.1  — seasonal smoothing (seasonal patterns are relatively stable)
 *
 * @param dailyPoints  All clean logged days for this product, any order
 * @param targetDate   The date we're forecasting for
 */
export function holtWinters(
  dailyPoints: Array<{ date: Date; qtySold: number }>,
  targetDate: Date,
  alpha = 0.3,
  beta  = 0.1,
  gamma = 0.1
): HWResult {
  const s = 7;

  // Sort chronologically, oldest first
  const sorted = [...dailyPoints].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Fall back gracefully if too few points for initialization
  if (sorted.length < 2) {
    const avg = sorted.length === 1 ? sorted[0].qtySold : 0;
    return { forecast: Math.max(0, avg), residuals: [] };
  }

  // ── Initialization ──────────────────────────────────────────────────────────
  // L₀ = mean of first period (up to 7 points)
  const firstPeriod = sorted.slice(0, Math.min(s, sorted.length));
  const L0 = firstPeriod.reduce((a, b) => a + b.qtySold, 0) / firstPeriod.length;

  // S[dow] = ratio of each day's value to period mean; unobserved DOWs = 1.0
  const S: number[] = Array(7).fill(1.0);
  for (const pt of firstPeriod) {
    const dow = pt.date.getUTCDay();
    S[dow] = L0 > 0 ? pt.qtySold / L0 : 1.0;
  }

  let L = L0;
  let T = 0; // No trend estimate from a single period

  // ── Smoothing loop ──────────────────────────────────────────────────────────
  const residuals: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const pt   = sorted[i];
    const A    = pt.qtySold;
    const dow  = pt.date.getUTCDay();
    const Sdow = S[dow] > 0 ? S[dow] : 1.0; // guard: never divide by 0

    const L_prev = L;
    const T_prev = T;

    // Collect residual BEFORE updating state = one-step-ahead in-sample fit
    if (i >= s) {
      const fitted = (L_prev + T_prev) * Sdow;
      residuals.push(A - fitted);
    }

    // Update level, trend, seasonal
    L = alpha * (A / Sdow) + (1 - alpha) * (L_prev + T_prev);
    T = beta  * (L - L_prev) + (1 - beta) * T_prev;
    S[dow] = gamma * (A / (L > 0 ? L : 1)) + (1 - gamma) * Sdow;
    if (S[dow] <= 0) S[dow] = 1.0; // clamp: prevent seasonal collapse (Amendment 5)
  }

  // ── Forecast ────────────────────────────────────────────────────────────────
  const lastDate    = sorted[sorted.length - 1].date;
  const msPerDay    = 86400 * 1000;
  const m           = Math.max(0, Math.round((targetDate.getTime() - lastDate.getTime()) / msPerDay));
  const targetDOW   = targetDate.getUTCDay();
  const Starget     = S[targetDOW] > 0 ? S[targetDOW] : 1.0;
  const forecast    = Math.max(0, (L + m * T) * Starget);

  return { forecast, residuals };
}

// ─── Accuracy metrics (WMA tier) ─────────────────────────────────────────────

/**
 * Rolling leave-one-out MAD on same-day series.
 * For each point i ≥ 1: forecast series[i] using wma(series[0..i-1]), measure |error|.
 * Returns null when series.length < 3 (needs ≥2 validation points to be meaningful).
 */
export function computeMAD(
  series: number[],
  forecastFn: (history: number[]) => number = wma
): number | null {
  if (series.length < 3) return null;
  const errors = series
    .slice(1)
    .map((actual, i) => Math.abs(actual - forecastFn(series.slice(0, i + 1))));
  return errors.reduce((a, b) => a + b, 0) / errors.length;
}

/**
 * Rolling leave-one-out bias on same-day series.
 * Positive bias = model under-forecasts (actual > forecast → baker under-bakes).
 * Negative bias = model over-forecasts (actual < forecast → baker over-bakes).
 * Returns null when series.length < 3.
 */
export function computeBias(
  series: number[],
  forecastFn: (history: number[]) => number = wma
): number | null {
  if (series.length < 3) return null;
  const errors = series
    .slice(1)
    .map((actual, i) => actual - forecastFn(series.slice(0, i + 1)));
  return errors.reduce((a, b) => a + b, 0) / errors.length;
}
