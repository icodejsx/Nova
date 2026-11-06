/**
 * Roqqu RAS client — SERVER ONLY.
 *
 * Never import this from a client component: it reads the secret API key.
 *
 * Env (all server-side, never NEXT_PUBLIC_*):
 *   ROQQU_API_KEY            secret key (test or live)
 *   ROQQU_ENV                "staging" (default) | "live"  → picks the auth header
 *   ROQQU_MODE               "mock" forces demo data even if a key is set
 *   ROQQU_BASE_URL           override https://service.roqqu.com/v1
 *   ROQQU_MERCHANT_EMAIL     merchant email for /balances and /history
 *   NEXT_PUBLIC_APP_URL      public https origin (used for payment-link redirects)
 */
import crypto from "node:crypto";
import type {
  FundSession,
  FundStatus,
  FundWallet,
  RoqquHistoryItem,
  RoqquPrices,
  RoqquWallet,
  WithdrawNetwork,
  WithdrawRecord,
  WithdrawRequest,
} from "./types";

const BASE_URL = process.env.ROQQU_BASE_URL ?? "https://service.roqqu.com/v1";
const ENV = process.env.ROQQU_ENV === "live" ? "live" : "staging";
const API_KEY = process.env.ROQQU_API_KEY ?? "";
const MERCHANT_EMAIL = process.env.ROQQU_MERCHANT_EMAIL ?? "ebentest@yopmail.com";

/** True when we should skip the network entirely and serve demo data. */
export function isMockMode(): boolean {
  return process.env.ROQQU_MODE === "mock" || !API_KEY;
}

function authHeader(): Record<string, string> {
  return ENV === "live"
    ? { "x-api-key": API_KEY }
    : { "x-staging-api-key": API_KEY };
}

type RoqquResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function roqquRequest<T>(
  path: string,
  opts: { method?: "GET" | "POST"; form?: Record<string, string> } = {}
): Promise<RoqquResult<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: opts.method ?? "GET",
      headers: {
        ...authHeader(),
        ...(opts.form
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : {}),
      },
      body: opts.form ? new URLSearchParams(opts.form).toString() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json().catch(() => null)) as
      | { status?: string; message?: string; data?: T }
      | null;
    if (!json) return { ok: false, error: `Roqqu HTTP ${res.status}` };
    if (json.status !== "success") {
      return { ok: false, error: json.message ?? `Roqqu HTTP ${res.status}` };
    }
    return { ok: true, data: json.data as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Roqqu request failed",
    };
  }
}

/* ------------------------------------------------------------------ */
/* Prices + fiat rates                                                  */
/* ------------------------------------------------------------------ */

const MOCK_USD: Record<string, number> = {
  btc: 95_000,
  eth: 3_200,
  usdt: 1,
  sol: 210,
  bnb: 620,
  xrp: 2.4,
  ltc: 95,
  doge: 0.2,
};
const MOCK_NGN_PER_USD = 1_500;

/** Walk an unknown JSON payload looking for an NGN rate (docs don't show the /rates shape). */
function extractNgnRate(payload: unknown): number | null {
  const seen = new Set<unknown>();
  const visit = (node: unknown): number | null => {
    if (!node || typeof node !== "object" || seen.has(node)) return null;
    seen.add(node);
    const obj = node as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) {
      if (/^ngn$/i.test(k)) {
        if (typeof v === "number") return v;
        if (typeof v === "string" && Number(v) > 0) return Number(v);
        if (v && typeof v === "object") {
          const inner = v as Record<string, unknown>;
          for (const key of ["rate", "value", "price"]) {
            const n = Number(inner[key]);
            if (n > 0) return n;
          }
        }
      }
    }
    const code = String(obj.currency ?? obj.code ?? obj.symbol ?? "").toLowerCase();
    if (code === "ngn") {
      for (const key of ["rate", "value", "price"]) {
        const n = Number(obj[key]);
        if (n > 0) return n;
      }
    }
    for (const v of Object.values(obj)) {
      const found = visit(v);
      if (found) return found;
    }
    return null;
  };
  const raw = visit(payload);
  if (!raw) return null;
  // Normalise: if the API returns USD-per-NGN, invert it.
  return raw < 1 ? 1 / raw : raw;
}

export async function getPrices(): Promise<RoqquPrices> {
  const mock = (note?: string): RoqquPrices => ({
    source: "mock",
    updatedAt: Date.now(),
    usd: MOCK_USD,
    ngnPerUsd: MOCK_NGN_PER_USD,
    note,
  });
  if (isMockMode()) return mock("Demo prices — set ROQQU_API_KEY for live data");

  const [tokens, rates] = await Promise.all([
    roqquRequest<{
      tokenConfigs?: { token: string; price_usd: number }[];
    }>("/tokens"),
    roqquRequest<unknown>("/rates"),
  ]);
  if (!tokens.ok) return mock(`Roqqu unavailable: ${tokens.error}`);

  const usd: Record<string, number> = { ...MOCK_USD };
  for (const t of tokens.data.tokenConfigs ?? []) {
    const price = Number(t.price_usd);
    if (t.token && price > 0) usd[t.token.toLowerCase()] = price;
  }
  const ngn = rates.ok ? extractNgnRate(rates.data) : null;
  return {
    source: "roqqu",
    updatedAt: Date.now(),
    usd,
    ngnPerUsd: ngn ?? MOCK_NGN_PER_USD,
    note: ngn ? undefined : "NGN rate unavailable — using fallback",
  };
}

/* ------------------------------------------------------------------ */
/* Payment links (fund balance)                                         */
/* ------------------------------------------------------------------ */

/** In-memory payment store. Demo-grade: swap for a DB before Mainnet. */
const store = globalThis as unknown as {
  __novaRoqquPayments?: Map<string, FundSession>;
  __novaRoqquEvents?: Set<string>;
};
const payments = (store.__novaRoqquPayments ??= new Map<string, FundSession>());
const seenEvents = (store.__novaRoqquEvents ??= new Set<string>());

export function newReference(): string {
  // Roqqu: 1–20 alphanumeric chars.
  const rand = crypto.randomBytes(4).toString("hex");
  return `NV${Date.now().toString(36)}${rand}`.slice(0, 20).toUpperCase();
}

export function getPayment(reference: string): FundSession | undefined {
  return payments.get(reference);
}

export function setPaymentStatus(
  reference: string,
  status: FundStatus,
  creditUsd?: number
): FundSession | undefined {
  const existing = payments.get(reference);
  if (!existing) return undefined;
  const next = {
    ...existing,
    status,
    creditUsd: creditUsd ?? existing.creditUsd,
  };
  payments.set(reference, next);
  return next;
}

/** Deterministic fake deposit addresses (clearly simulated; derived from the payment reference). */
function mockWallets(reference: string): FundWallet[] {
  const h = (salt: string) =>
    crypto.createHash("sha256").update(`${salt}:${reference}`).digest("hex");
  const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const B32 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  const pick = (hex: string, alphabet: string, len: number) =>
    Array.from({ length: len }, (_, i) =>
      alphabet[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % alphabet.length]
    ).join("");
  return [
    { network: "trc20", token: "USDT", address: `T${pick(h("trc"), B58, 33)}` },
    { network: "bep20", token: "USDT", address: `0x${h("bep").slice(0, 40)}` },
    { network: "bitcoin", token: "BTC", address: `bc1q${pick(h("btc"), B32, 38)}` },
  ];
}

export async function createPaymentLink(input: {
  reference: string;
  amount: number;
  currency: "ngn" | "usd";
  creditUsd: number;
  email: string;
  firstName: string;
  lastName: string;
  origin: string;
}): Promise<FundSession> {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const base: FundSession = {
    source: "mock",
    reference: input.reference,
    paymentLink: null,
    amount: input.amount,
    currency: input.currency,
    creditUsd: input.creditUsd,
    expiresAt,
    status: "pending",
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? input.origin;
  const httpsOk = appUrl.startsWith("https://");

  if (isMockMode() || !httpsOk) {
    const session: FundSession = {
      ...base,
      // Nova's simulated hosted checkout (mirrors Roqqu's payment-link page).
      paymentLink: `/fund/checkout/${input.reference}`,
      wallets: mockWallets(input.reference),
      note: isMockMode()
        ? "Simulation mode — Roqqu flow is simulated, no real funds move"
        : "Roqqu requires HTTPS redirect URLs — set NEXT_PUBLIC_APP_URL to your deployed https origin",
    };
    payments.set(input.reference, session);
    return session;
  }

  const result = await roqquRequest<{
    refid: string;
    payment_link: string;
    expires_at?: string;
    wallets?: FundWallet[];
  }>("/payment-links", {
    method: "POST",
    form: {
      amount: String(input.amount),
      customer_details: JSON.stringify({
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
      }),
      payment_reference: input.reference,
      success_url: `${appUrl}/fund?status=success&ref=${input.reference}`,
      cancel_url: `${appUrl}/fund?status=cancelled&ref=${input.reference}`,
      amount_currency: input.currency,
      metadata: JSON.stringify({ app: "nova", creditUsd: input.creditUsd }),
      wallets: JSON.stringify([
        { network: "trc20", token: "USDT" },
        { network: "bep20", token: "USDT" },
        { network: "bitcoin", token: "BTC" },
      ]),
    },
  });

  if (!result.ok) {
    const session: FundSession = {
      ...base,
      paymentLink: `/fund/checkout/${input.reference}`,
      wallets: mockWallets(input.reference),
      note: `Roqqu error: ${result.error} — using simulated checkout`,
    };
    payments.set(input.reference, session);
    return session;
  }

  const session: FundSession = {
    ...base,
    source: "roqqu",
    wallets: result.data.wallets,
    paymentLink: result.data.payment_link,
    expiresAt: result.data.expires_at ?? expiresAt,
  };
  payments.set(input.reference, session);
  return session;
}

/* ------------------------------------------------------------------ */
/* Webhooks                                                             */
/* ------------------------------------------------------------------ */

/** Decrypt a Roqqu webhook body (aes-256-ctr; key = first 32 chars of API key; iv = x-api-key header, hex). */
export function decryptWebhook(hashHex: string, ivHex: string): unknown | null {
  if (!API_KEY) return null;
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-ctr",
      API_KEY.substring(0, 32),
      Buffer.from(ivHex, "hex")
    );
    const out = Buffer.concat([
      decipher.update(Buffer.from(hashHex, "hex")),
      decipher.final(),
    ]).toString("utf8");
    try {
      return JSON.parse(out);
    } catch {
      return out;
    }
  } catch {
    return null;
  }
}

export interface PaymentLinkEvent {
  event_id: string;
  event_type:
    | "payment_link_completed"
    | "payment_link_completed_overpaid"
    | "payment_link_failed"
    | string;
  meta_data: {
    payment_reference?: string;
    amount_received_usd?: number;
    status?: string;
    [k: string]: unknown;
  };
}

/** Apply a webhook event. Returns false for duplicates / unknown events. */
export function applyPaymentEvent(event: PaymentLinkEvent): boolean {
  if (!event?.event_id || seenEvents.has(event.event_id)) return false;
  const ref = event.meta_data?.payment_reference;
  if (!ref) return false;
  seenEvents.add(event.event_id);

  if (event.event_type === "payment_link_failed") {
    setPaymentStatus(ref, "failed");
    return true;
  }
  if (
    event.event_type === "payment_link_completed" ||
    event.event_type === "payment_link_completed_overpaid"
  ) {
    const received = Number(event.meta_data.amount_received_usd);
    const existing = payments.get(ref);
    // Credit what Roqqu says it received (covers overpayment); fall back to the quote.
    const credit = received > 0 ? received : existing?.creditUsd ?? 0;
    if (!existing) {
      payments.set(ref, {
        source: "roqqu",
        reference: ref,
        paymentLink: null,
        amount: credit,
        currency: "usd",
        creditUsd: credit,
        expiresAt: new Date().toISOString(),
        status: "completed",
      });
    } else {
      setPaymentStatus(ref, "completed", credit);
    }
    return true;
  }
  return false;
}

/**
 * Simulate Roqqu's `payment_link_completed` webhook for a *simulated* session.
 * Refuses real (source "roqqu") sessions, so it can never fake a live payment.
 */
export function simulatePaymentCompleted(reference: string): FundSession | null {
  const payment = payments.get(reference);
  if (!payment || payment.source !== "mock") return null;
  if (payment.status === "pending") {
    applyPaymentEvent({
      event_id: `evt_sim_${reference}`,
      event_type: "payment_link_completed",
      meta_data: {
        payment_reference: reference,
        amount_received_usd: payment.creditUsd,
        status: "completed",
      },
    });
  }
  return payments.get(reference) ?? null;
}

/* ------------------------------------------------------------------ */
/* Cash out: POST /wallets/send (+ GET /transaction/refId/:refid)       */
/* ------------------------------------------------------------------ */

const ADDRESS_RULES: Record<WithdrawNetwork, RegExp> = {
  trc20: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
  bep20: /^0x[a-fA-F0-9]{40}$/,
};
const MIN_SEND = 5;
const MAX_SEND = 5_000;
/** Roqqu's /transaction/fee example uses a 1% rate; fee is taken from the token sent. */
const SEND_FEE_PCT = 1;
/** Simulated "on-chain confirmation" delay (stands in for the token_sent webhook). */
const MOCK_CONFIRM_MS = 8_000;

const sendStore = globalThis as unknown as {
  __novaRoqquSends?: Map<string, WithdrawRecord>;
};
const sends = (sendStore.__novaRoqquSends ??= new Map<string, WithdrawRecord>());

export function quoteSend(amount: number) {
  const fee = Math.round(amount * SEND_FEE_PCT) / 100;
  return { fee, net: Math.round((amount - fee) * 100) / 100 };
}

export async function sendCoin(
  input: WithdrawRequest
): Promise<{ ok: true; record: WithdrawRecord } | { ok: false; error: string }> {
  const { amount, network, to, token } = input;
  if (token !== "usdt") return { ok: false, error: "invalid token symbol parsed" };
  if (!(network in ADDRESS_RULES)) return { ok: false, error: "invalid network parsed" };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "amount must be greater than 0" };
  }
  if (!ADDRESS_RULES[network].test(to)) {
    return { ok: false, error: "invalid network parsed for address" };
  }
  if (amount < MIN_SEND) return { ok: false, error: `minimum send is ${MIN_SEND}` };
  if (amount > MAX_SEND) return { ok: false, error: `maximum send is ${MAX_SEND}` };

  const { fee, net } = quoteSend(amount);
  const base: WithdrawRecord = {
    source: "mock",
    refid: `${Date.now()}${crypto.randomInt(1_000_000, 9_999_999)}`,
    status: "queued",
    amount,
    fee,
    net,
    network,
    to,
    token,
    txHash: null,
    createdAt: new Date().toISOString(),
  };

  if (isMockMode()) {
    const record = { ...base, note: "Simulated send — no funds moved" };
    sends.set(record.refid, record);
    return { ok: true, record };
  }

  const result = await roqquRequest<{ refid: string }>("/wallets/send", {
    method: "POST",
    form: { amount: String(amount), network, to, token },
  });
  if (!result.ok) return { ok: false, error: result.error };
  const record: WithdrawRecord = {
    ...base,
    source: "roqqu",
    refid: String(result.data.refid),
  };
  sends.set(record.refid, record);
  return { ok: true, record };
}

export async function getSend(refid: string): Promise<WithdrawRecord | null> {
  const record = sends.get(refid);
  if (!record) return null;
  if (record.status !== "queued") return record;

  if (record.source === "mock") {
    if (Date.now() - Date.parse(record.createdAt) < MOCK_CONFIRM_MS) return record;
    const done: WithdrawRecord = {
      ...record,
      status: "completed",
      txHash: crypto.createHash("sha256").update(record.refid).digest("hex"),
    };
    sends.set(refid, done);
    return done;
  }

  const live = await roqquRequest<{ tx_hash?: string | null }>(
    `/transaction/refId/${encodeURIComponent(refid)}`
  );
  if (live.ok && live.data.tx_hash) {
    const done: WithdrawRecord = {
      ...record,
      status: "completed",
      txHash: live.data.tx_hash,
    };
    sends.set(refid, done);
    return done;
  }
  return record;
}

/* ------------------------------------------------------------------ */
/* Wallet: balances + history                                           */
/* ------------------------------------------------------------------ */

export async function getWallet(): Promise<RoqquWallet> {
  const now = new Date().toISOString();
  const mock = (note?: string): RoqquWallet => ({
    source: "mock",
    balances: { usdt: 137, btc: 0.0021, eth: 0.04, sol: 1.5 },
    history: [
      { id: 4158, status: 1, direction: "credit", token: "usdt", amount: 100, createdAt: now },
      { id: 4157, status: 1, direction: "debit", token: "usdt", amount: 12.5, createdAt: now },
      { id: 4150, status: 1, direction: "credit", token: "btc", amount: 0.0021, createdAt: now },
    ],
    note,
  });
  if (isMockMode()) return mock("Simulated treasury wallet — set ROQQU_API_KEY and ROQQU_MODE=live for real data");

  const [bal, hist] = await Promise.all([
    roqquRequest<{ balance?: Record<string, unknown> }>("/balances", {
      method: "POST",
      form: { email: MERCHANT_EMAIL },
    }),
    roqquRequest<{ history?: Record<string, unknown>[] }>("/history", {
      method: "POST",
      form: { email: MERCHANT_EMAIL },
    }),
  ]);
  if (!bal.ok) return mock(`Roqqu unavailable: ${bal.error}`);

  const balances: Record<string, number> = {};
  for (const [k, v] of Object.entries(bal.data.balance ?? {})) {
    if (typeof v === "number" && !["id"].includes(k)) balances[k] = v;
  }
  const history: RoqquHistoryItem[] = hist.ok
    ? (hist.data.history ?? []).slice(0, 20).map((h) => ({
        id: String(h.id ?? ""),
        status: Number(h.status ?? 0),
        direction: String(h.direction ?? ""),
        token: String(h.token ?? ""),
        amount: Number(h.amount ?? 0),
        createdAt: String(h.created_at ?? ""),
      }))
    : [];
  return { source: "roqqu", balances, history };
}
