"use client";

import { useSyncExternalStore } from "react";
import {
  getAccountState,
  getServerAccountState,
  subscribeAccountState,
  type AccountState,
} from "@/app/lib/account-client";

/** The signed-in user's account (balance, wallet ID, activity), live-updating. */
export function useAccount(): AccountState {
  return useSyncExternalStore(
    subscribeAccountState,
    getAccountState,
    getServerAccountState
  );
}

/** Nova balance (USD-equivalent) funded via Roqqu. */
export function useCredit(): number {
  return useAccount().balance;
}
