/**
 * Hierarchical demand forecasting for bakery ingredients.
 *
 * Method selection is automatic based on data availability:
 *   < 4 points   → Naïve (last observation carried forward)
 *   4–9 points   → SES   (Single Exponential Smoothing, optimised α)
 *   10–20 points → Holt  (Double Exponential Smoothing, optimised α+β)
 *   ≥ 21 points  → Holt-Winters Additive, s=7 (weekly season + trend)
 *
 * Parameter tuning: exhaustive grid search minimising in-sample RMSE
 * on one-step-ahead forecasts.
 *
 * Safety stock uses forecast RMSE as the uncertainty proxy (σ̂), which
 * captures model uncertainty during lead time more accurately than
 * raw historical standard deviation.
 */

import { prisma } from "./prisma";

// ─── Constants ────────────────────────────────────────────────────────────────

const SEASON = 7; // weekly periodicity for bakeries

// Grid-search candidates
const A_GRID = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const B_GRID = [0.05, 0.1, 0.2, 0.3, 0.4];
const G_GRID = [0.05, 0.1, 0.2, 0.3, 0.4];

// ─── Types ────────────────────────────────────────────────────────────────────

export type ForecastMethod = "NAIVE" | "SMA" | "SES" | "HOLT" | "HOLT_WINTERS";

export interface ForecastMetrics {
  /** Mean Absolute Deviation — same units as demand */
  mad: number;
  /** Mean Squared Error */
  mse: number;
  /** Root MSE — back in original units, penalises large errors */
  rmse: number;
  /** Mean Absolute % Error — null when any actual == 0 */
  mape: number | null;
  /** Systematic over/under-forecasting */
  bias: number;
  /** Cumulative error ÷ MAD. Healthy model: −4 to +4 */
  trackingSignal: number;
}

export interface ForecastResult {
  method: ForecastMethod;
  /** One-step-ahead in-sample forecasts (same length as input) */
  fitted: number[];
  /** actual − fitted */
  residuals: number[];
  /** F(t+1) */
  forecastNext: number;
  /** F(t+1) … F(t+H) */
  forecastHorizon: number[];
  metrics: ForecastMetrics;
  params: Partial<{
    alpha: number;
    beta: number;
    gamma: number;
    n: number;
    seasonLength: number;
  }>;
}

// ─── Accuracy metrics ─────────────────────────────────────────────────────────

function computeMetrics(actuals: number[], fitted: number[]): ForecastMetrics {
  // Skip index 0 — it's the initialisation point, trivially "perfect"
  const pairs = actuals.slice(1).map((a, i) => ({ a, f: fitted[i + 1] }));
  const n = pairs.length;

  if (n === 0) {
    return { mad: 0, mse: 0, rmse: 0, mape: null, bias: 0, trackingSignal: 0 };
  }

  const errors = pairs.map(({ a, f }) => a - f);
  const absErrors = errors.map(Math.abs);
  const mad = absErrors.reduce((s, v) => s + v, 0) / n;
  const mse = errors.reduce((s, v) => s + v * v, 0) / n;
  const rmse = Math.sqrt(mse);
  const bias = errors.reduce((s, v) => s + v, 0) / n;
  const hasZero = pairs.some(({ a }) => a === 0);
  const mape = hasZero
    ? null
    : (pairs.reduce((s, { a, f }) => s + Math.abs(a - f) / a, 0) / n) * 100;
  const trackingSignal = mad > 0 ? errors.reduce((s, v) => s + v, 0) / mad : 0;

  return { mad, mse, rmse, mape, bias, trackingSignal };
}

// ─── Naïve ────────────────────────────────────────────────────────────────────

function forecastNaive(data: number[], horizon: number): ForecastResult {
  // fitted[t] = A(t-1), fitted[0] = A(0)
  const fitted = [data[0], ...data.slice(0, data.length - 1)];
  const last = data[data.length - 1];
  return {
    method: "NAIVE",
    fitted,
    residuals: data.map((a, i) => a - fitted[i]),
    forecastNext: last,
    forecastHorizon: Array(horizon).fill(last),
    metrics: computeMetrics(data, fitted),
    params: {},
  };
}

// ─── SMA ─────────────────────────────────────────────────────────────────────

function forecastSMA(data: number[], n: number, horizon: number): ForecastResult {
  const fitted: number[] = [];
  for (let t = 0; t < data.length; t++) {
    const window = data.slice(Math.max(0, t - n), t);
    fitted.push(window.length > 0 ? window.reduce((a, b) => a + b, 0) / window.length : data[0]);
  }
  const last = data.slice(-n).reduce((a, b) => a + b, 0) / Math.min(n, data.length);
  return {
    method: "SMA",
    fitted,
    residuals: data.map((a, i) => a - fitted[i]),
    forecastNext: last,
    forecastHorizon: Array(horizon).fill(last),
    metrics: computeMetrics(data, fitted),
    params: { n },
  };
}

// ─── SES — Single Exponential Smoothing ──────────────────────────────────────
// F(t+1) = α·A(t) + (1−α)·F(t)

function runSES(data: number[], alpha: number): { fitted: number[]; L: number } {
  const fitted: number[] = [];
  let L = data[0];
  for (let t = 0; t < data.length; t++) {
    fitted.push(L); // forecast FOR period t
    L = alpha * data[t] + (1 - alpha) * L;
  }
  return { fitted, L }; // L is now F(n+1)
}

function forecastSES(data: number[], alpha: number, horizon: number): ForecastResult {
  const { fitted, L } = runSES(data, alpha);
  return {
    method: "SES",
    fitted,
    residuals: data.map((a, i) => a - fitted[i]),
    forecastNext: L,
    forecastHorizon: Array(horizon).fill(L),
    metrics: computeMetrics(data, fitted),
    params: { alpha },
  };
}

function optimizeSES(data: number[], horizon: number): ForecastResult {
  let best: ForecastResult | null = null;
  for (const alpha of A_GRID) {
    const r = forecastSES(data, alpha, horizon);
    if (!best || r.metrics.rmse < best.metrics.rmse) best = r;
  }
  return best!;
}

// ─── Holt — Double Exponential Smoothing (trend) ─────────────────────────────
// L(t) = α·A(t) + (1−α)·[L(t−1) + T(t−1)]
// T(t) = β·[L(t) − L(t−1)] + (1−β)·T(t−1)
// F(t+m) = L(t) + m·T(t)

function runHolt(
  data: number[],
  alpha: number,
  beta: number,
): { fitted: number[]; L: number; T: number } {
  const fitted: number[] = [];
  let L = data[0];
  let T = 0;
  for (let t = 0; t < data.length; t++) {
    fitted.push(L + T); // forecast FOR period t
    const Lprev = L;
    L = alpha * data[t] + (1 - alpha) * (L + T);
    T = beta * (L - Lprev) + (1 - beta) * T;
  }
  return { fitted, L, T };
}

function forecastHolt(
  data: number[],
  alpha: number,
  beta: number,
  horizon: number,
): ForecastResult {
  const { fitted, L, T } = runHolt(data, alpha, beta);
  const forecastHorizon = Array.from({ length: horizon }, (_, m) => L + (m + 1) * T);
  return {
    method: "HOLT",
    fitted,
    residuals: data.map((a, i) => a - fitted[i]),
    forecastNext: L + T,
    forecastHorizon,
    metrics: computeMetrics(data, fitted),
    params: { alpha, beta },
  };
}

function optimizeHolt(data: number[], horizon: number): ForecastResult {
  let best: ForecastResult | null = null;
  for (const alpha of A_GRID) {
    for (const beta of B_GRID) {
      const r = forecastHolt(data, alpha, beta, horizon);
      if (!best || r.metrics.rmse < best.metrics.rmse) best = r;
    }
  }
  return best!;
}

// ─── Holt-Winters Additive ────────────────────────────────────────────────────
// L(t) = α·[A(t) − S(t−s)] + (1−α)·[L(t−1) + T(t−1)]
// T(t) = β·[L(t) − L(t−1)] + (1−β)·T(t−1)
// S(t) = γ·[A(t) − L(t)] + (1−γ)·S(t−s)
// F(t+m) = L(t) + m·T(t) + S(t−s+m)
//
// Additive chosen over multiplicative: handles zero-demand days
// (closed bakery, ingredient not used) without division-by-zero.

function initHW(data: number[], s: number): { L: number; T: number; S: number[] } {
  const nSeasons = Math.floor(data.length / s);
  const season1 = data.slice(0, s);
  const L = season1.reduce((a, b) => a + b, 0) / s;
  const T =
    nSeasons >= 2
      ? (data.slice(s, 2 * s).reduce((a, b) => a + b, 0) / s - L) / s
      : 0;
  const S = season1.map((v) => v - L); // additive indices
  return { L, T, S };
}

function runHW(
  data: number[],
  alpha: number,
  beta: number,
  gamma: number,
  s: number,
): { fitted: number[]; L: number; T: number; S: number[] } {
  const { L: initL, T: initT, S: initS } = initHW(data, s);
  let L = initL;
  let T = initT;
  const S = [...initS];
  const fitted: number[] = [];

  for (let t = 0; t < data.length; t++) {
    const si = t % s;
    fitted.push(L + T + S[si]); // forecast FOR period t
    const Lprev = L;
    L = alpha * (data[t] - S[si]) + (1 - alpha) * (L + T);
    T = beta * (L - Lprev) + (1 - beta) * T;
    S[si] = gamma * (data[t] - L) + (1 - gamma) * S[si];
  }

  return { fitted, L, T, S };
}

function forecastHoltWinters(
  data: number[],
  alpha: number,
  beta: number,
  gamma: number,
  s: number,
  horizon: number,
): ForecastResult {
  const { fitted, L, T, S } = runHW(data, alpha, beta, gamma, s);
  const n = data.length;
  // For m periods ahead (1-indexed), the seasonal index is (n + m - 1) % s
  const forecastHorizon = Array.from(
    { length: horizon },
    (_, i) => L + (i + 1) * T + S[(n + i) % s],
  );
  return {
    method: "HOLT_WINTERS",
    fitted,
    residuals: data.map((a, i) => a - fitted[i]),
    forecastNext: forecastHorizon[0],
    forecastHorizon,
    metrics: computeMetrics(data, fitted),
    params: { alpha, beta, gamma, seasonLength: s },
  };
}

function optimizeHoltWinters(data: number[], s: number, horizon: number): ForecastResult {
  let best: ForecastResult | null = null;
  for (const alpha of A_GRID) {
    for (const beta of B_GRID) {
      for (const gamma of G_GRID) {
        const r = forecastHoltWinters(data, alpha, beta, gamma, s, horizon);
        if (!best || r.metrics.rmse < best.metrics.rmse) best = r;
      }
    }
  }
  return best!;
}

// ─── Auto-selector ────────────────────────────────────────────────────────────

/**
 * Select and fit the best method for a daily demand series.
 * All parameters are optimised via grid search (minimise in-sample RMSE).
 */
export function autoForecast(data: number[], horizon = 30): ForecastResult {
  const n = data.length;
  if (n < 4) return forecastNaive(n > 0 ? data : [0], horizon);
  if (n < 10) return optimizeSES(data, horizon);
  if (n < SEASON * 3) return optimizeHolt(data, horizon);
  return optimizeHoltWinters(data, SEASON, horizon);
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

/**
 * Build a dense daily sales series for one recipe over the last `days` days.
 * Zero-filled for days with no recorded sales.
 */
export async function getRecipeSalesSeries(
  tenantId: string,
  recipeId: string,
  days = 90,
): Promise<number[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const sales = await prisma.sale.findMany({
    where: { tenantId, recipeId, soldAt: { gte: since } },
    orderBy: { soldAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (const s of sales) {
    const day = s.soldAt.toISOString().split("T")[0];
    byDay.set(day, (byDay.get(day) ?? 0) + s.qty);
  }

  const series: number[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    series.push(byDay.get(d.toISOString().split("T")[0]) ?? 0);
  }
  return series;
}

/**
 * Fetch daily PRODUCTION usage from the ledger and return a dense series.
 * Used for ingredient-level reorder calculations.
 */
export async function getIngredientDemandSeries(
  tenantId: string,
  ingredientId: string,
  days = 90,
): Promise<number[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const entries = await prisma.inventoryLedger.findMany({
    where: { tenantId, ingredientId, reason: "PRODUCTION", createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, number>();
  for (const e of entries) {
    const day = e.createdAt.toISOString().split("T")[0];
    byDay.set(day, (byDay.get(day) ?? 0) + Math.abs(e.qty));
  }

  const series: number[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    series.push(byDay.get(d.toISOString().split("T")[0]) ?? 0);
  }
  return series;
}

/**
 * Run the full forecast pipeline for one ingredient (reorder use).
 */
export async function forecastDailyDemand(
  tenantId: string,
  ingredientId: string,
  leadTimeDays: number,
): Promise<{ avgDailyUsage: number; sigma: number; result: ForecastResult }> {
  const series = await getIngredientDemandSeries(tenantId, ingredientId, 90);

  if (series.every((v) => v === 0)) {
    return { avgDailyUsage: 0, sigma: 0, result: forecastNaive([0], leadTimeDays) };
  }

  const result = autoForecast(series, leadTimeDays);
  const avgDailyUsage =
    result.forecastHorizon.reduce((a, b) => a + b, 0) / result.forecastHorizon.length;

  return { avgDailyUsage: Math.max(0, avgDailyUsage), sigma: result.metrics.rmse, result };
}
