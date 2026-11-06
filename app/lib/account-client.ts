/**
 * Browser-side mirror of the signed-in user's account (balance, wallet ID,
 * activity). The server is the source of truth — this just caches what
 * `/api/account` returns and notifies React when it changes.
 */
import type { LedgerEntry } from "@/app/lib/roqqu/types";

export interface AccountState {
  /** false until the first /api/account response arrives */
  loaded: boolean;
  signedIn: boolean;
  email: string;
  walletId: string;
  balance: number;
  entries: LedgerEntry[];
  /** Nova team member (set by the server). */
  isAdmin: boolean;
}

const INITIAL: AccountState = {
  loaded: false,
  signedIn: false,
  email: "",
  walletId: "",
  balance: 0,
  entries: [],
  isAdmin: false,
};

let state: AccountState = INITIAL;
const listeners = new Set<() => void>();

function set(next: AccountState) {
  state = next;
  listeners.forEach((l) => l());
}

export function getAccountState(): AccountState {
  return state;
}

export function getServerAccountState(): AccountState {
  return INITIAL;
}

export function subscribeAccountState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

interface ApiAccount {
  signedIn: boolean;
  email?: string;
  walletId?: string;
  balance?: number;
  entries?: LedgerEntry[];
  isAdmin?: boolean;
}

/** Adopt an account payload the server just returned (sign-in, spend, …). */
export function applyAccount(api: ApiAccount) {
  if (!api.signedIn) {
    set({ ...INITIAL, loaded: true });
    return;
  }
  set({
    loaded: true,
    signedIn: true,
    email: api.email ?? "",
    walletId: api.walletId ?? "",
    balance: api.balance ?? 0,
    entries: api.entries ?? [],
    isAdmin: api.isAdmin ?? false,
  });
}

/** Re-read the account from the server. */
export async function refreshAccount(): Promise<void> {
  try {
    const res = await fetch("/api/account", { cache: "no-store" });
    applyAccount((await res.json()) as ApiAccount);
  } catch {
    if (!state.loaded) set({ ...INITIAL, loaded: true });
  }
}

export async function signOut(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    set({ ...INITIAL, loaded: true });
  }
}

/** Debit a stake from the balance on the server. */
export async function spendCredit(
  amountUsd: number,
  label: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/account/spend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountUsd, label }),
    });
    const json = (await res.json()) as ApiAccount & { error?: string };
    if (!res.ok) {
      if (res.status === 401) applyAccount({ signedIn: false });
      return { ok: false, error: json.error ?? "Could not place the trade." };
    }
    applyAccount(json);
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error — try again." };
  }
}
