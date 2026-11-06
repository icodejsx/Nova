/**
 * Client-side Nova balance (USD-equivalent stake credit funded through Roqqu)
 * plus an activity ledger. Demo-grade: localStorage. Production would be a
 * server ledger keyed by wallet.
 */
import type { LedgerEntry } from "./types";

export const CREDIT_KEY = "nova-credit-v1";
const EVT = "nova-credit-change";
const MAX_ENTRIES = 50;

export interface CreditState {
  balance: number;
  /** payment references already credited (idempotency) */
  credited: string[];
  entries: LedgerEntry[];
}

const EMPTY: CreditState = { balance: 0, credited: [], entries: [] };

export function parseCredit(raw: string | null): CreditState {
  if (!raw) return EMPTY;
  try {
    const p = JSON.parse(raw) as Partial<CreditState>;
    return {
      balance: Number(p.balance) || 0,
      credited: Array.isArray(p.credited) ? p.credited : [],
      entries: Array.isArray(p.entries) ? p.entries : [],
    };
  } catch {
    return EMPTY;
  }
}

export function readCredit(): CreditState {
  if (typeof window === "undefined") return EMPTY;
  return parseCredit(localStorage.getItem(CREDIT_KEY));
}

function write(state: CreditState) {
  localStorage.setItem(CREDIT_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVT));
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function entry(
  type: LedgerEntry["type"],
  amountUsd: number,
  label: string
): LedgerEntry {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    amountUsd,
    label,
    at: Date.now(),
  };
}

/** Credit a completed Roqqu payment once. Returns true if newly credited. */
export function creditPayment(reference: string, amountUsd: number): boolean {
  const state = readCredit();
  if (state.credited.includes(reference) || !(amountUsd > 0)) return false;
  write({
    balance: round2(state.balance + amountUsd),
    credited: [...state.credited, reference],
    entries: [
      entry("fund", amountUsd, `Roqqu deposit ${reference.slice(0, 8)}`),
      ...state.entries,
    ].slice(0, MAX_ENTRIES),
  });
  return true;
}

/** Spend from the balance (bet or withdrawal). Returns false if insufficient. */
export function spendCredit(
  amountUsd: number,
  meta: { type: "bet" | "withdraw"; label: string } = {
    type: "bet",
    label: "Market trade",
  }
): boolean {
  const state = readCredit();
  if (!(amountUsd > 0) || state.balance < amountUsd) return false;
  write({
    ...state,
    balance: round2(state.balance - amountUsd),
    entries: [entry(meta.type, -amountUsd, meta.label), ...state.entries].slice(
      0,
      MAX_ENTRIES
    ),
  });
  return true;
}

export function subscribeCredit(cb: () => void): () => void {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}
