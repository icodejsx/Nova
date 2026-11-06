/** Shared (client + server) types for the Roqqu RAS integration. */

/** Where a response came from: the real Roqqu API or the built-in demo fallback. */
export type RoqquSource = "roqqu" | "mock";

export interface RoqquPrices {
  source: RoqquSource;
  updatedAt: number;
  /** token symbol (lowercase) → USD price */
  usd: Record<string, number>;
  /** NGN per 1 USD */
  ngnPerUsd: number;
  /** Set when we fell back to demo data, explains why. */
  note?: string;
}

export type FundCurrency = "ngn" | "usd";

export interface FundRequest {
  amount: number;
  currency: FundCurrency;
  email: string;
  firstName: string;
  lastName: string;
}

export type FundStatus = "pending" | "completed" | "failed";

export interface FundWallet {
  network: "bitcoin" | "trc20" | "bep20";
  token: "BTC" | "USDT";
  address: string;
}

export interface FundSession {
  source: RoqquSource;
  reference: string;
  /** Hosted Roqqu checkout (real link, or Nova's simulated checkout in mock mode). */
  paymentLink: string | null;
  /** Deposit addresses the payer can send to. */
  wallets?: FundWallet[];
  amount: number;
  currency: FundCurrency;
  /** USD-equivalent that will be credited to the Nova balance. */
  creditUsd: number;
  expiresAt: string;
  status: FundStatus;
  note?: string;
}

export interface RoqquWallet {
  source: RoqquSource;
  /** token symbol → balance */
  balances: Record<string, number>;
  history: RoqquHistoryItem[];
  note?: string;
}

export interface RoqquHistoryItem {
  id: number | string;
  status: number;
  direction: "credit" | "debit" | string;
  token: string;
  amount: number;
  createdAt: string;
}

/* ---- Cash out (POST /wallets/send) ---- */

export type WithdrawNetwork = "trc20" | "bep20";

export interface WithdrawRequest {
  /** Gross USD amount debited from the Nova balance (fee is taken from this). */
  amount: number;
  network: WithdrawNetwork;
  to: string;
  token: "usdt";
}

export interface WithdrawRecord {
  source: RoqquSource;
  /** Roqqu send reference id */
  refid: string;
  status: "queued" | "completed" | "failed";
  amount: number;
  fee: number;
  /** What the recipient receives (amount − fee). */
  net: number;
  network: WithdrawNetwork;
  to: string;
  token: "usdt";
  txHash: string | null;
  createdAt: string;
  note?: string;
}

/* ---- Client activity ledger ---- */

export interface LedgerEntry {
  id: string;
  type: "fund" | "bet" | "withdraw";
  /** Signed USD: positive = credit, negative = debit. */
  amountUsd: number;
  label: string;
  at: number;
}

/** Tokens Nova surfaces (all supported by Roqqu). XLM is not a Roqqu asset. */
export const ROQQU_TOKENS = ["btc", "eth", "usdt", "sol", "bnb", "xrp", "ltc"] as const;

/** Detect the Roqqu-priced asset a market question is about, if any. */
export function detectAsset(question: string): { token: string; label: string } | null {
  const q = question.toLowerCase();
  const table: [RegExp, string, string][] = [
    [/\b(bitcoin|btc)\b/, "btc", "BTC"],
    [/\b(ethereum|ether|eth)\b/, "eth", "ETH"],
    [/\b(solana|sol)\b/, "sol", "SOL"],
    [/\b(xrp|ripple)\b/, "xrp", "XRP"],
    [/\b(litecoin|ltc)\b/, "ltc", "LTC"],
    [/\b(bnb|binance coin)\b/, "bnb", "BNB"],
  ];
  for (const [re, token, label] of table) {
    if (re.test(q)) return { token, label };
  }
  return null;
}
