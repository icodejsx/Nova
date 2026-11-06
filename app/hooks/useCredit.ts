"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  CREDIT_KEY,
  parseCredit,
  subscribeCredit,
  type CreditState,
} from "@/app/lib/roqqu/credit";

const getRaw = () => localStorage.getItem(CREDIT_KEY) ?? "";

/** Full Nova credit state (balance + activity), live-updating. */
export function useCreditState(): CreditState {
  const raw = useSyncExternalStore(subscribeCredit, getRaw, () => "");
  return useMemo(() => parseCredit(raw || null), [raw]);
}

/** Nova balance (USD-equivalent) funded via Roqqu. */
export function useCredit(): number {
  return useCreditState().balance;
}
